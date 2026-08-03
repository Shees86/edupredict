import db
CONFIRM_PHRASE = "DELETE ALL DATA"


def main():
    print("This will permanently delete:")
    print("  - all documents in 'students'")
    print("  - all documents in 'predictions'")
    print("  - all documents in 'alerts'")
    print("  - all documents in 'feedback'")
    print()
    wipe_users = input("Also delete ALL user accounts (including admin1/teacher1/etc)? [y/N]: ").strip().lower() == "y"
    if wipe_users:
        print("  - all documents in 'users' (you will need to re-register/seed accounts)")
    typed = input(f"\nType '{CONFIRM_PHRASE}' to confirm: ").strip()
    if typed != CONFIRM_PHRASE:
        print("Cancelled — nothing was deleted.")
        return
    r1 = db.students_col.delete_many({})
    r2 = db.predictions_col.delete_many({})
    r3 = db.alerts_col.delete_many({})
    r4 = db.feedback_col.delete_many({})
    print(f"Deleted {r1.deleted_count} students, {r2.deleted_count} predictions, "
          f"{r3.deleted_count} alerts, {r4.deleted_count} feedback entries.")
    if wipe_users:
        r5 = db.users_col.delete_many({})
        print(f"Deleted {r5.deleted_count} user accounts.")
    print("\nDone. Database is clean — add real data via registration, CSV upload, or your own seed script.")
if __name__ == "__main__":
    main()
