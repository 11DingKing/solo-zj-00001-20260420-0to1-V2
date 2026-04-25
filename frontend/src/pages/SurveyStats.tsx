import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { surveyApi } from '../services/api';
import type { SurveyStats, QuestionStats, SingleChoiceStats, MultipleChoiceStats, TextStats } from '../types';

function SurveyStats() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadStats(id);
    }
  }, [id]);

  const loadStats = async (surveyId: string) => {
    try {
      setLoading(true);
      const data = await surveyApi.getSurveyStats(surveyId);
      setStats(data);
    } catch (err) {
      setError('加载统计数据失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isSingleChoiceStats = (stat: QuestionStats): stat is SingleChoiceStats => {
    return stat.type === 'single_choice';
  };

  const isMultipleChoiceStats = (stat: QuestionStats): stat is MultipleChoiceStats => {
    return stat.type === 'multiple_choice';
  };

  const isTextStats = (stat: QuestionStats): stat is TextStats => {
    return stat.type === 'text';
  };

  const renderChoiceChart = (stat: SingleChoiceStats | MultipleChoiceStats, index: number) => {
    const chartData = stat.options.map((opt, i) => ({
      name: `选项${String.fromCharCode(65 + i)}`,
      fullName: opt.option_text,
      人数: opt.count,
      百分比: opt.percentage,
    }));

    return (
      <div key={index} className="stats-section">
        <h3>
          {index + 1}. {stat.question_text}
          <span style={{ marginLeft: '10px', fontSize: '14px', color: '#888' }}>
            ({stat.type === 'single_choice' ? '单选题' : '多选题'})
          </span>
        </h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{ background: 'white', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>{data.fullName}</p>
                        <p style={{ margin: '0 0 3px 0' }}>人数: {data.人数}</p>
                        <p style={{ margin: '0' }}>百分比: {data.百分比}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="人数" fill="#667eea" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ marginTop: '10px' }}>
          {stat.options.map((opt, i) => (
            <div
              key={i}
              style={{
                display: 'inline-block',
                marginRight: '20px',
                marginBottom: '5px',
                fontSize: '12px',
                color: '#666',
              }}
            >
              {String.fromCharCode(65 + i)}. {opt.option_text}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTextStats = (stat: TextStats, index: number) => {
    return (
      <div key={index} className="stats-section">
        <h3>
          {index + 1}. {stat.question_text}
          <span style={{ marginLeft: '10px', fontSize: '14px', color: '#888' }}>(填空题)</span>
        </h3>
        {stat.answers.length === 0 ? (
          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '4px', textAlign: 'center', color: '#888' }}>
            暂无回答
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: '10px', color: '#666', fontSize: '14px' }}>
              共 {stat.answers.length} 条回答
            </p>
            <div className="text-answers">
              {stat.answers.map((answer, i) => (
                <div key={i} className="text-answer-item">
                  <span style={{ color: '#888', fontSize: '12px', marginRight: '8px' }}>
                    #{i + 1}
                  </span>
                  {answer}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
            返回列表
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container">
        <div className="error">统计数据不存在</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2>问卷统计 - {stats.survey_title}</h2>
        <div className="btn-group">
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            返回列表
          </button>
        </div>
      </div>

      <div className="card">
        <h2>提交概览</h2>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#667eea' }}>
          总提交数: {stats.total_submissions}
        </div>
      </div>

      <div className="card">
        <h2>详细统计</h2>
        {stats.stats.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px' }}>
            暂无统计数据
          </div>
        ) : (
          stats.stats.map((stat, index) => {
            if (isSingleChoiceStats(stat) || isMultipleChoiceStats(stat)) {
              return renderChoiceChart(stat, index);
            }
            if (isTextStats(stat)) {
              return renderTextStats(stat, index);
            }
            return null;
          })
        )}
      </div>

      <div className="btn-group">
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          返回列表
        </button>
      </div>
    </div>
  );
}

export default SurveyStats;
