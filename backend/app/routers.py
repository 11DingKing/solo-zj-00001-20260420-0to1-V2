from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import Survey, Question, Option, Submission, Answer, AnswerOptions
from app.schemas import (
    SurveyCreate, SurveyUpdate, SurveyResponse, SurveyListResponse,
    SubmissionCreate, SubmissionResponse, SurveyStats,
    SingleChoiceStats, MultipleChoiceStats, TextStats, OptionStats
)

router = APIRouter(prefix="/api", tags=["surveys"])

@router.post("/surveys", response_model=SurveyResponse, status_code=status.HTTP_201_CREATED)
def create_survey(survey_data: SurveyCreate, db: Session = Depends(get_db)):
    db_survey = Survey(
        title=survey_data.title,
        description=survey_data.description,
        deadline=survey_data.deadline,
        max_submissions=survey_data.max_submissions,
        is_published=False
    )
    db.add(db_survey)
    db.flush()
    
    for question_data in survey_data.questions:
        db_question = Question(
            survey_id=db_survey.id,
            type=question_data.type.value,
            text=question_data.text,
            is_required=question_data.is_required,
            order=question_data.order
        )
        db.add(db_question)
        db.flush()
        
        if question_data.options:
            for option_data in question_data.options:
                db_option = Option(
                    question_id=db_question.id,
                    text=option_data.text,
                    order=option_data.order
                )
                db.add(db_option)
    
    db.commit()
    db.refresh(db_survey)
    
    response = SurveyResponse(
        id=db_survey.id,
        title=db_survey.title,
        description=db_survey.description,
        deadline=db_survey.deadline,
        max_submissions=db_survey.max_submissions,
        is_published=db_survey.is_published,
        created_at=db_survey.created_at,
        questions=db_survey.questions,
        submission_count=0
    )
    return response

@router.get("/surveys", response_model=List[SurveyListResponse])
def list_surveys(db: Session = Depends(get_db)):
    surveys = db.query(Survey).order_by(Survey.created_at.desc()).all()
    
    results = []
    for survey in surveys:
        submission_count = db.query(Submission).filter(
            Submission.survey_id == survey.id
        ).count()
        
        results.append(SurveyListResponse(
            id=survey.id,
            title=survey.title,
            description=survey.description,
            deadline=survey.deadline,
            max_submissions=survey.max_submissions,
            is_published=survey.is_published,
            created_at=survey.created_at,
            submission_count=submission_count
        ))
    
    return results

@router.get("/surveys/{survey_id}", response_model=SurveyResponse)
def get_survey(survey_id: str, db: Session = Depends(get_db)):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="问卷不存在")
    
    submission_count = db.query(Submission).filter(
        Submission.survey_id == survey.id
    ).count()
    
    response = SurveyResponse(
        id=survey.id,
        title=survey.title,
        description=survey.description,
        deadline=survey.deadline,
        max_submissions=survey.max_submissions,
        is_published=survey.is_published,
        created_at=survey.created_at,
        questions=survey.questions,
        submission_count=submission_count
    )
    return response

@router.put("/surveys/{survey_id}", response_model=SurveyResponse)
def update_survey(survey_id: str, survey_data: SurveyUpdate, db: Session = Depends(get_db)):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="问卷不存在")
    
    update_data = survey_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(survey, key, value)
    
    db.commit()
    db.refresh(survey)
    
    submission_count = db.query(Submission).filter(
        Submission.survey_id == survey.id
    ).count()
    
    response = SurveyResponse(
        id=survey.id,
        title=survey.title,
        description=survey.description,
        deadline=survey.deadline,
        max_submissions=survey.max_submissions,
        is_published=survey.is_published,
        created_at=survey.created_at,
        questions=survey.questions,
        submission_count=submission_count
    )
    return response

@router.delete("/surveys/{survey_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_survey(survey_id: str, db: Session = Depends(get_db)):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="问卷不存在")
    
    db.delete(survey)
    db.commit()

@router.post("/submissions", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_survey(submission_data: SubmissionCreate, db: Session = Depends(get_db)):
    survey = db.query(Survey).filter(Survey.id == submission_data.survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="问卷不存在")
    
    if not survey.is_published:
        raise HTTPException(status_code=400, detail="问卷尚未发布")
    
    if survey.deadline and datetime.utcnow() > survey.deadline:
        raise HTTPException(status_code=400, detail="问卷已过期")
    
    current_submissions = db.query(Submission).filter(
        Submission.survey_id == survey.id
    ).count()
    
    if survey.max_submissions and current_submissions >= survey.max_submissions:
        raise HTTPException(status_code=400, detail="已达到最大提交人数")
    
    questions = db.query(Question).filter(
        Question.survey_id == survey.id
    ).order_by(Question.order).all()
    
    for question in questions:
        if question.is_required:
            answer = next(
                (a for a in submission_data.answers if a.question_id == question.id),
                None
            )
            if not answer:
                raise HTTPException(
                    status_code=400,
                    detail=f"必填问题 '{question.text}' 未回答"
                )
            if question.type == "single_choice" and not answer.option_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"问题 '{question.text}' 需要选择一个选项"
                )
            if question.type == "multiple_choice" and not answer.option_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"问题 '{question.text}' 需要选择至少一个选项"
                )
            if question.type == "text" and not answer.text:
                raise HTTPException(
                    status_code=400,
                    detail=f"问题 '{question.text}' 需要填写内容"
                )
    
    db_submission = Submission(survey_id=survey.id)
    db.add(db_submission)
    db.flush()
    
    for answer_data in submission_data.answers:
        question = db.query(Question).filter(
            Question.id == answer_data.question_id,
            Question.survey_id == survey.id
        ).first()
        
        if not question:
            continue
        
        db_answer = Answer(
            submission_id=db_submission.id,
            question_id=question.id,
            text=answer_data.text if question.type == "text" else None
        )
        db.add(db_answer)
        db.flush()
        
        if answer_data.option_ids:
            for option_id in answer_data.option_ids:
                option = db.query(Option).filter(
                    Option.id == option_id,
                    Option.question_id == question.id
                ).first()
                if option:
                    db_answer_option = AnswerOptions(
                        answer_id=db_answer.id,
                        option_id=option_id
                    )
                    db.add(db_answer_option)
    
    db.commit()
    db.refresh(db_submission)
    
    return SubmissionResponse(
        id=db_submission.id,
        survey_id=db_submission.survey_id,
        submitted_at=db_submission.submitted_at
    )

@router.get("/surveys/{survey_id}/stats", response_model=SurveyStats)
def get_survey_stats(survey_id: str, db: Session = Depends(get_db)):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="问卷不存在")
    
    questions = db.query(Question).filter(
        Question.survey_id == survey.id
    ).order_by(Question.order).all()
    
    total_submissions = db.query(Submission).filter(
        Submission.survey_id == survey.id
    ).count()
    
    stats_list = []
    
    for question in questions:
        if question.type == "single_choice":
            options = db.query(Option).filter(
                Option.question_id == question.id
            ).order_by(Option.order).all()
            
            option_stats = []
            for option in options:
                count = db.query(func.count(AnswerOptions.id)).filter(
                    AnswerOptions.option_id == option.id
                ).scalar() or 0
                
                percentage = (count / total_submissions * 100) if total_submissions > 0 else 0
                
                option_stats.append(OptionStats(
                    option_id=option.id,
                    option_text=option.text,
                    count=count,
                    percentage=round(percentage, 2)
                ))
            
            stats_list.append(SingleChoiceStats(
                question_id=question.id,
                question_text=question.text,
                options=option_stats
            ))
        
        elif question.type == "multiple_choice":
            options = db.query(Option).filter(
                Option.question_id == question.id
            ).order_by(Option.order).all()
            
            option_stats = []
            for option in options:
                count = db.query(func.count(AnswerOptions.id)).filter(
                    AnswerOptions.option_id == option.id
                ).scalar() or 0
                
                percentage = (count / total_submissions * 100) if total_submissions > 0 else 0
                
                option_stats.append(OptionStats(
                    option_id=option.id,
                    option_text=option.text,
                    count=count,
                    percentage=round(percentage, 2)
                ))
            
            stats_list.append(MultipleChoiceStats(
                question_id=question.id,
                question_text=question.text,
                options=option_stats
            ))
        
        elif question.type == "text":
            answers = db.query(Answer).filter(
                Answer.question_id == question.id,
                Answer.text.isnot(None),
                Answer.text != ""
            ).all()
            
            text_answers = [a.text for a in answers if a.text]
            
            stats_list.append(TextStats(
                question_id=question.id,
                question_text=question.text,
                answers=text_answers
            ))
    
    return SurveyStats(
        survey_id=survey.id,
        survey_title=survey.title,
        total_submissions=total_submissions,
        stats=stats_list
    )
