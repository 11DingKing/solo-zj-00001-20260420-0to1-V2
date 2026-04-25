from sqlalchemy import Column, Text, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base

class Survey(Base):
    __tablename__ = "surveys"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    description = Column(Text)
    deadline = Column(DateTime(timezone=True))
    max_submissions = Column(Integer)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    questions = relationship("Question", back_populates="survey", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="survey")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    survey_id = Column(UUID(as_uuid=True), ForeignKey("surveys.id", ondelete="CASCADE"))
    type = Column(Text, nullable=False)
    text = Column(Text, nullable=False)
    is_required = Column(Boolean, default=False)
    order = Column("order", Integer, nullable=False, quote=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    survey = relationship("Survey", back_populates="questions")
    options = relationship("Option", back_populates="question", cascade="all, delete-orphan")
    answers = relationship("Answer", back_populates="question")

class Option(Base):
    __tablename__ = "options"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"))
    text = Column(Text, nullable=False)
    order = Column("order", Integer, nullable=False, quote=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    question = relationship("Question", back_populates="options")

class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    survey_id = Column(UUID(as_uuid=True), ForeignKey("surveys.id", ondelete="CASCADE"))
    ip_address = Column(Text)
    submitted_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    survey = relationship("Survey", back_populates="submissions")
    answers = relationship("Answer", back_populates="submission", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(UUID(as_uuid=True), ForeignKey("submissions.id", ondelete="CASCADE"))
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"))
    text = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    submission = relationship("Submission", back_populates="answers")
    question = relationship("Question", back_populates="answers")

class AnswerOptions(Base):
    __tablename__ = "answer_options"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    answer_id = Column(UUID(as_uuid=True), ForeignKey("answers.id", ondelete="CASCADE"))
    option_id = Column(UUID(as_uuid=True), ForeignKey("options.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
