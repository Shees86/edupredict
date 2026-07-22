# HDFS Setup (Pseudo-Distributed / Single-Node) — EduPredict

This satisfies the project's "Utilize HDFS for scalable storage" requirement
without needing a real multi-machine cluster. Do this on your own laptop
(Linux or WSL2 on Windows recommended).

## 1. Install Java + Hadoop

```bash
sudo apt update
sudo apt install openjdk-11-jdk -y
wget https://downloads.apache.org/hadoop/common/hadoop-3.3.6/hadoop-3.3.6.tar.gz
tar -xzvf hadoop-3.3.6.tar.gz
sudo mv hadoop-3.3.6 /usr/local/hadoop
```

Add to `~/.bashrc`:
```bash
export HADOOP_HOME=/usr/local/hadoop
export PATH=$PATH:$HADOOP_HOME/bin:$HADOOP_HOME/sbin
export JAVA_HOME=$(readlink -f /usr/bin/java | sed "s:bin/java::")
```
Then `source ~/.bashrc`.

## 2. Configure pseudo-distributed mode

Edit `$HADOOP_HOME/etc/hadoop/core-site.xml`:
```xml
<configuration>
  <property>
    <name>fs.defaultFS</name>
    <value>hdfs://localhost:9000</value>
  </property>
</configuration>
```

Edit `$HADOOP_HOME/etc/hadoop/hdfs-site.xml`:
```xml
<configuration>
  <property>
    <name>dfs.replication</name>
    <value>1</value>
  </property>
</configuration>
```

## 3. Format the NameNode and start HDFS

```bash
hdfs namenode -format
start-dfs.sh
jps   # should show NameNode, DataNode, SecondaryNameNode
```

Check it's alive in the browser: http://localhost:9870

## 4. Push the EduPredict dataset into HDFS

```bash
hdfs dfs -mkdir -p /edupredict/raw
hdfs dfs -put data/students_sample.csv /edupredict/raw/
hdfs dfs -ls /edupredict/raw
```

## 5. Run the PySpark pipeline against HDFS

```bash
pip install pyspark
spark-submit spark/pyspark_pipeline.py
```

This reads `/edupredict/raw/students_sample.csv` from HDFS, cleans +
feature-engineers it, and writes the result to
`/edupredict/processed/students_clean` back in HDFS.

## For your project report

Screenshot these for the documentation deliverable:
- `http://localhost:9870` NameNode web UI showing the file in `/edupredict/raw/`
- Output of `hdfs dfs -ls -R /edupredict`
- Terminal output of the Spark job (cohort stats + anomaly counts)

This is enough to demonstrate genuine HDFS storage + Spark distributed
processing usage for evaluation, even on a single laptop.
