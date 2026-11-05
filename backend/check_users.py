"""
Check all users in the Neon Cloud Database.
Run from terminal: python backend/check_users.py
"""
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

import auth_service
from sqlalchemy import text

def check_users():
    print(f"\nConnected to: {auth_service.engine.url.render_as_string(hide_password=True)}")
    with auth_service.engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, full_name, official_email, role, department, approval_status, created_at
            FROM employee_accounts
            ORDER BY id ASC
        """))
        users = [dict(row._mapping) for row in result.fetchall()]

    print(f"\nTotal users registered: {len(users)}\n" + "-" * 75)
    print(f"{'ID':<4} | {'Full Name':<15} | {'Email':<30} | {'Role':<8} | {'Status':<10}")
    print("-" * 75)
    for u in users:
        print(f"{u['id']:<4} | {u['full_name']:<15} | {u['official_email']:<30} | {u['role']:<8} | {u['approval_status']:<10}")
    print("-" * 75 + "\n")

if __name__ == "__main__":
    check_users()

