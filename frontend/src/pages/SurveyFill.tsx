import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyApi } from '../services/api';
import type { Survey, Question, AnswerSubmit } from '../types';

interface AnswerState {
  [questionId: string]: {
    text?: string;
    optionIds?: string[];
  };
}

function SurveyFill() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      loadSurvey(id);
    }
  }, [id]);

  const loadSurvey = async (surveyId: string) => {
    try {
      setLoading(true);
      const data = await surveyApi.getSurvey(surveyId);
      setSurvey(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载问卷失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleChoiceChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { optionIds: [optionId] }
    }));
  };

  const handleMultipleChoiceChange = (questionId: string, optionId: string, checked: boolean) => {
    setAnswers(prev => {
      const current = prev[questionId]?.optionIds || [];
      const newOptionIds = checked
        ? [...current, optionId]
        : current.filter(id => id !== optionId);
      return {
        ...prev,
        [questionId]: { optionIds: newOptionIds }
      };
    });
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { text }
    }));
  };

  const validate = (): boolean => {
    if (!survey) return false;
    
    const errors: string[] = [];

    survey.questions?.forEach((question, index) => {
      if (question.is_required) {
        const answer = answers[question.id!];
        
        if (!answer) {
          errors.push(`第 ${index + 1} 题是必填项`);
          return;
        }

        if (question.type === 'single_choice' && (!answer.optionIds || answer.optionIds.length === 0)) {
          errors.push(`第 ${index + 1} 题是必填项，请选择一个选项`);
        }

        if (question.type === 'multiple_choice' && (!answer.optionIds || answer.optionIds.length === 0)) {
          errors.push(`第 ${index + 1} 题是必填项，请至少选择一个选项`);
        }

        if (question.type === 'text' && (!answer.text || answer.text.trim() === '')) {
          errors.push(`第 ${index + 1} 题是必填项，请填写内容`);
        }
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!survey || !validate()) return;

    try {
      setSubmitting(true);
      setError(null);

      const submissionAnswers: AnswerSubmit[] = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: questionId,
        text: answer.text,
        option_ids: answer.optionIds,
      }));

      await surveyApi.submitSurvey({
        survey_id: survey.id,
        answers: submissionAnswers,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || '提交失败');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <div className="btn-group" style={{ marginTop: '20px' }}>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ marginBottom: '20px', color: '#28a745' }}>提交成功！</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>感谢您的参与。</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="container">
        <div className="error">问卷不存在</div>
      </div>
    );
  }

  const renderQuestion = (question: Question, index: number) => {
    const answer = answers[question.id!];

    return (
      <div key={question.id} className="question-renderer">
        <div className="question-text">
          {index + 1}. {question.text}
          {question.is_required && <span className="question-required">*</span>}
        </div>

        {question.type === 'single_choice' && (
          <div className="radio-group">
            {question.options?.map((option) => (
              <label key={option.id} className="radio-option">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={answer?.optionIds?.includes(option.id!) || false}
                  onChange={() => handleSingleChoiceChange(question.id!, option.id!)}
                />
                <span>{option.text}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'multiple_choice' && (
          <div className="checkbox-group">
            {question.options?.map((option) => (
              <label key={option.id} className="checkbox-option">
                <input
                  type="checkbox"
                  value={option.id}
                  checked={answer?.optionIds?.includes(option.id!) || false}
                  onChange={(e) => handleMultipleChoiceChange(question.id!, option.id!, e.target.checked)}
                />
                <span>{option.text}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'text' && (
          <textarea
            className="text-input"
            value={answer?.text || ''}
            onChange={(e) => handleTextChange(question.id!, e.target.value)}
            placeholder="请输入您的回答..."
          />
        )}
      </div>
    );
  };

  return (
    <div className="container">
      <div className="card">
        <div className="survey-fill-header">
          <h1>{survey.title}</h1>
          {survey.description && <p>{survey.description}</p>}
          
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#888' }}>
            {survey.deadline && (
              <span>截止时间: {new Date(survey.deadline).toLocaleString('zh-CN')}</span>
            )}
            {survey.max_submissions && (
              <span style={{ marginLeft: '20px' }}>
                已提交: {survey.submission_count} / {survey.max_submissions}
              </span>
            )}
          </div>
        </div>

        <div className="divider" />

        {validationErrors.length > 0 && (
          <div className="error">
            <ul>
              {validationErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {survey.questions?.map((question, index) => renderQuestion(question, index))}

        <div className="divider" />

        <div className="btn-group">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? '提交中...' : '提交问卷'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SurveyFill;
