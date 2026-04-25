import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyApi } from '../services/api';
import type { Question, QuestionType } from '../types';

function SurveyCreate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxSubmissions, setMaxSubmissions] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isEdit && id) {
      loadSurvey(id);
    }
  }, [isEdit, id]);

  const loadSurvey = async (surveyId: string) => {
    try {
      setLoading(true);
      const survey = await surveyApi.getSurvey(surveyId);
      setTitle(survey.title);
      setDescription(survey.description || '');
      setDeadline(survey.deadline ? survey.deadline.slice(0, 16) : '');
      setMaxSubmissions(survey.max_submissions?.toString() || '');
      setQuestions(survey.questions || []);
    } catch (err) {
      setError('加载问卷失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      type,
      text: '',
      is_required: false,
      order: questions.length,
      options: type !== 'text' ? [
        { text: '', order: 0 },
        { text: '', order: 1 },
      ] : undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions.map((q, i) => ({ ...q, order: i })));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    setQuestions(newQuestions);
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];
    if (question.options) {
      question.options.push({
        text: '',
        order: question.options.length,
      });
      setQuestions(newQuestions);
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];
    if (question.options && question.options.length > 2) {
      question.options = question.options.filter((_, i) => i !== optionIndex);
      question.options = question.options.map((o, i) => ({ ...o, order: i }));
      setQuestions(newQuestions);
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];
    if (question.options) {
      question.options[optionIndex].text = value;
      setQuestions(newQuestions);
    }
  };

  const validate = (): boolean => {
    const errors: string[] = [];

    if (!title.trim()) {
      errors.push('请输入问卷标题');
    }

    if (questions.length === 0) {
      errors.push('至少需要添加一道题');
    }

    questions.forEach((q, index) => {
      if (!q.text.trim()) {
        errors.push(`第 ${index + 1} 题的问题内容不能为空`);
      }

      if (q.type !== 'text') {
        if (!q.options || q.options.length < 2) {
          errors.push(`第 ${index + 1} 题至少需要 2 个选项`);
        } else {
          q.options.forEach((o, oIndex) => {
            if (!o.text.trim()) {
              errors.push(`第 ${index + 1} 题的第 ${oIndex + 1} 个选项不能为空`);
            }
          });
        }
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const cleanQuestions = () => {
    return questions.map(q => {
      const cleanedQuestion: any = {
        type: q.type,
        text: q.text,
        is_required: q.is_required,
        order: q.order,
      };
      
      if (q.options && q.options.length > 0) {
        cleanedQuestion.options = q.options.map(o => ({
          text: o.text,
          order: o.order,
        }));
      }
      
      return cleanedQuestion;
    });
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      setError(null);

      const surveyData = {
        title,
        description: description || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        max_submissions: maxSubmissions ? parseInt(maxSubmissions) : undefined,
        questions: cleanQuestions(),
      };

      if (isEdit && id) {
        await surveyApi.updateSurvey(id, {
          title: surveyData.title,
          description: surveyData.description,
          deadline: surveyData.deadline,
          max_submissions: surveyData.max_submissions,
        });
        alert('更新成功');
      } else {
        const newSurvey = await surveyApi.createSurvey(surveyData);
        alert('创建成功');
        navigate(`/edit/${newSurvey.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '保存失败');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'single_choice': return '单选题';
      case 'multiple_choice': return '多选题';
      case 'text': return '填空题';
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h2>{isEdit ? '编辑问卷' : '创建问卷'}</h2>
        <div className="btn-group">
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            返回列表
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      
      {validationErrors.length > 0 && (
        <div className="error">
          <ul>
            {validationErrors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2>基本信息</h2>
        
        <div className="form-group">
          <label>问卷标题 <span style={{ color: '#dc3545' }}>*</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入问卷标题"
            maxLength={255}
          />
        </div>

        <div className="form-group">
          <label>问卷描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入问卷描述（可选）"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>截止时间</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>最大提交人数</label>
            <input
              type="number"
              value={maxSubmissions}
              onChange={(e) => setMaxSubmissions(e.target.value)}
              placeholder="不限制"
              min={1}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>问题列表</h2>
        
        <div className="btn-group" style={{ marginBottom: '20px' }}>
          <button onClick={() => addQuestion('single_choice')} className="btn btn-primary btn-sm">
            + 添加单选题
          </button>
          <button onClick={() => addQuestion('multiple_choice')} className="btn btn-primary btn-sm">
            + 添加多选题
          </button>
          <button onClick={() => addQuestion('text')} className="btn btn-primary btn-sm">
            + 添加填空题
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px' }}>
            点击上方按钮添加问题
          </div>
        ) : (
          questions.map((question, qIndex) => (
            <div key={qIndex} className="question-editor">
              <div className="question-editor-header">
                <h3>
                  第 {qIndex + 1} 题 - {getQuestionTypeLabel(question.type)}
                  {question.is_required && <span style={{ color: '#dc3545' }}> *</span>}
                </h3>
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="btn btn-danger btn-sm"
                >
                  删除
                </button>
              </div>

              <div className="form-group">
                <label>问题内容</label>
                <input
                  type="text"
                  value={question.text}
                  onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                  placeholder={`请输入第 ${qIndex + 1} 题的内容`}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={question.is_required}
                    onChange={(e) => updateQuestion(qIndex, 'is_required', e.target.checked)}
                  />
                  是否必填
                </label>
              </div>

              {question.type !== 'text' && (
                <div className="form-group">
                  <label>选项</label>
                  {question.options?.map((option, oIndex) => (
                    <div key={oIndex} className="option-item">
                      <span style={{ minWidth: '60px', color: '#888' }}>
                        {String.fromCharCode(65 + oIndex)}.
                      </span>
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`选项 ${String.fromCharCode(65 + oIndex)}`}
                      />
                      {question.options && question.options.length > 2 && (
                        <button
                          onClick={() => removeOption(qIndex, oIndex)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          删除
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(qIndex)}
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '8px' }}
                  >
                    + 添加选项
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="btn-group">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? '保存中...' : '保存问卷'}
        </button>
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          取消
        </button>
      </div>
    </div>
  );
}

export default SurveyCreate;
