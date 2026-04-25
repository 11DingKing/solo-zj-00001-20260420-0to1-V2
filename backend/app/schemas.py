from __future__ import annotations
from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Union
from datetime import datetime
from enum import Enum

class QuestionType(str, Enum):
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    TEXT = "text"

class OptionCreate(BaseModel):
    text: str = Field(..., min_length=1)
    order: int = Field(..., ge=0)

class OptionResponse(BaseModel):
    id: str
    text: str
    order: int
    
    class Config:
        from_attributes = True

class QuestionCreate(BaseModel):
    type: QuestionType
    text: str = Field(..., min_length=1)
    is_required: bool = False
    order: int = Field(..., ge=0)
    options: Optional[List[OptionCreate]] = None
    
    @model_validator(mode='after')
    def validate_choice_options(self) -> 'QuestionCreate':
        if self.type in [QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE]:
            if not self.options or len(self.options) < 2:
                raise ValueError('选择题至少需要2个选项')
        return self

class QuestionResponse(BaseModel):
    id: str
    type: QuestionType
    text: str
    is_required: bool
    order: int
    options: Optional[List[OptionResponse]] = None
    
    class Config:
        from_attributes = True

class SurveyCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    max_submissions: Optional[int] = Field(None, ge=1)
    questions: List[QuestionCreate] = Field(..., min_length=1)

class SurveyUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    max_submissions: Optional[int] = Field(None, ge=1)
    is_published: Optional[bool] = None

class SurveyResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    max_submissions: Optional[int] = None
    is_published: bool
    created_at: datetime
    questions: Optional[List[QuestionResponse]] = None
    submission_count: int = 0
    
    class Config:
        from_attributes = True

class SurveyListResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    max_submissions: Optional[int] = None
    is_published: bool
    created_at: datetime
    submission_count: int = 0
    
    class Config:
        from_attributes = True

class AnswerSubmit(BaseModel):
    question_id: str
    text: Optional[str] = None
    option_ids: Optional[List[str]] = None

class SubmissionCreate(BaseModel):
    survey_id: str
    answers: List[AnswerSubmit]

class SubmissionResponse(BaseModel):
    id: str
    survey_id: str
    submitted_at: datetime
    
    class Config:
        from_attributes = True

class OptionStats(BaseModel):
    option_id: str
    option_text: str
    count: int
    percentage: float

class SingleChoiceStats(BaseModel):
    question_id: str
    question_text: str
    type: str = "single_choice"
    options: List[OptionStats]

class MultipleChoiceStats(BaseModel):
    question_id: str
    question_text: str
    type: str = "multiple_choice"
    options: List[OptionStats]

class TextStats(BaseModel):
    question_id: str
    question_text: str
    type: str = "text"
    answers: List[str]

class SurveyStats(BaseModel):
    survey_id: str
    survey_title: str
    total_submissions: int
    stats: List[Union[SingleChoiceStats, MultipleChoiceStats, TextStats]]
