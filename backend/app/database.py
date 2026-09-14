"""
إعداد الاتصال بقاعدة البيانات.
افتراضيًا يستخدم SQLite محليًا للتجربة السريعة، وللإنتاج على شبكة المدرسة
يكفي تغيير المتغير DATABASE_URL في ملف .env إلى رابط PostgreSQL، مثال:
DATABASE_URL=postgresql://user:password@localhost:5432/school
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./school.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
