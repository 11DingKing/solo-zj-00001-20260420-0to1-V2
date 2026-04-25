from __future__ import annotations
from pydantic import BaseModel, Field, model_validator, PlainSerializer, BeforeValidator
from typing_extensions import Annotated
from typing import List, Optional, Union, Any
from datetime import datetime
from enum import Enum
import uuid


def validate_uuid(value: Any) -> uuid.UUID:
    if isinstance(value, uuid.UUID):
        return value
    if isinstance(value, str):
        try:
            return uuid.UUID(value)
        except ValueError:
            raise ValueError(f"Invalid UUID format: {value}")
    raise ValueError(f"Expected UUID or str, got {type(value)}")


def serialize_uuid(value: uuid.UUID) -> str:
    return str(value)


UUIDType = Annotated[
    uuid.UUID,
    BeforeValidator(validate_uuid),
    PlainSerializer(serialize_uuid),
]


class QuestionType(str, Enum):
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    TEXT = "text"

class OptionCreate(BaseModel):
    text: str = Field(..., min_length=1)
    order: int = Field(..., ge=0)

class OptionResponse(BaseModel):
    id: UUIDType
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
    id: UUIDType
    type: QuestionType
    text: str
    is_required: bool
    order: int
    options: Optional[List[OptionResponse]] = None
    
    class Config:
        from_attributes = True

class SurveyCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    max_submissions: Optional[int] = Field(None, ge=1)
    questions: List[QuestionCreate] = Field(..., min_length=1)

class SurveyUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    max_submissions: Optional[int] = Field(None, ge=1)
    is_published: Optional[bool] = None

class SurveyResponse(BaseModel):
    id: UUIDType
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
    id: UUIDType
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
    question_id: UUIDType
    text: Optional[str] = None
    option_ids: Optional[List[UUIDType]] = None

class SubmissionCreate(BaseModel):
    survey_id: UUIDType
    answers: List[AnswerSubmit]

class SubmissionResponse(BaseModel):
    id: UUIDType
    survey_id: UUIDType
    submitted_at: datetime
    
    class Config:
        from_attributes = True

class OptionStats(BaseModel):
    option_id: UUIDType
    option_text: str
    count: int
    percentage: float

class SingleChoiceStats(BaseModel):
    question_id: UUIDType
    question_text: str
    type: str = "single_choice"
    options: List[OptionStats]

class MultipleChoiceStats(BaseModel):
    question_id: UUIDType
    question_text: str
    type: str = "multiple_choice"
    options: List[OptionStats]

class TextStats(BaseModel):
    question_id: UUIDType
    question_text: str
    type: str = "text"
    answers: List[str]

class SurveyStats(BaseModel):
    survey_id: UUIDType
    survey_title: str
    total_submissions: int
    stats: List[Union[SingleChoiceStats, MultipleChoiceStats, TextStats]]
