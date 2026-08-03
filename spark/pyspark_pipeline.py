from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import DoubleType
HDFS_INPUT_PATH = "hdfs://localhost:9000/edupredict/raw/students_sample.csv"
HDFS_OUTPUT_PATH = "hdfs://localhost:9000/edupredict/processed/students_clean"
LOCAL_INPUT_PATH = "data/students_sample.csv"
LOCAL_OUTPUT_PATH = "data/students_clean_parquet"


def build_spark_session():
    return (
        SparkSession.builder
        .appName("EduPredict-DataProcessing")
        .master("local[*]")
        .getOrCreate()
    )


def run_pipeline(use_hdfs: bool = True):
    spark = build_spark_session()
    input_path = HDFS_INPUT_PATH if use_hdfs else LOCAL_INPUT_PATH
    output_path = HDFS_OUTPUT_PATH if use_hdfs else LOCAL_OUTPUT_PATH
    print(f"Reading raw data from: {input_path}")
    df = spark.read.csv(input_path, header=True, inferSchema=True)
    numeric_cols = [
        "attendance_rate", "avg_test_score", "assignments_submitted_pct",
        "study_hours_per_week", "previous_semester_gpa",
        "lms_login_frequency_per_week"
    ]
    for c in numeric_cols:
        mean_val = df.select(F.mean(F.col(c))).first()[0]
        df = df.na.fill({c: mean_val})
    df = df.na.fill({
        "gender": "Unknown",
        "family_income_level": "Medium",
        "parental_education": "Secondary",
        "extracurricular": "No",
    })
    df = df.withColumn(
        "engagement_score",
        (F.col("attendance_rate") * 0.4 +
         F.col("assignments_submitted_pct") * 0.3 +
         F.col("lms_login_frequency_per_week") * 5 * 0.3).cast(DoubleType())
    )
    df = df.withColumn(
        "anomaly_flag",
        F.when(
            (F.col("attendance_rate") > 85) & (F.col("avg_test_score") < 40),
            F.lit("HighAttendance_LowScore")
        ).when(
            (F.col("attendance_rate") < 50) & (F.col("avg_test_score") > 80),
            F.lit("LowAttendance_HighScore")
        ).otherwise(F.lit("Normal"))
    )
    cohort_stats = (
        df.groupBy("family_income_level")
        .agg(
            F.avg("attendance_rate").alias("avg_attendance"),
            F.avg("avg_test_score").alias("avg_score"),
            F.avg("dropout_risk").alias("dropout_rate")
        )
    )
    print("Cohort-level stats (per family income bracket):")
    cohort_stats.show()
    print("Anomaly counts:")
    df.groupBy("anomaly_flag").count().show()
    print(f"Writing cleaned dataset to: {output_path}")
    df.write.mode("overwrite").parquet(output_path)
    spark.stop()
    print("Pipeline complete.")
if __name__ == "__main__":
    import sys
    use_hdfs = "--local" not in sys.argv
    run_pipeline(use_hdfs=use_hdfs)
