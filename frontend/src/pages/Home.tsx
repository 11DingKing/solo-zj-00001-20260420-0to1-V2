import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { surveyApi } from '../services/api';
import type { Survey } from '../types';

function Home() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const data = await surveyApi.getSurveys();
      setSurveys(data);
    } catch (err) {
      setError('加载问卷列表失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个问卷吗？')) return;
    try {
      setDeleteId(id);
      await surveyApi.deleteSurvey(id);
      setSurveys(surveys.filter(s => s.id !== id));
    } catch (err) {
      setError('删除问卷失败');
      console.error(err);
    } finally {
      setDeleteId(null);
    }
  };

  const handlePublish = async (survey: Survey) => {
    try {
      await surveyApi.updateSurvey(survey.id, { is_published: !survey.is_published });
      loadSurveys();
    } catch (err) {
      setError('操作失败');
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2>问卷列表</h2>
        <Link to="/create" className="btn btn-primary">
          + 创建新问卷
        </Link>
      </div>

      {error && <div className="error">{error}</div>}

      {surveys.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p>暂无问卷</p>
            <Link to="/create" className="btn btn-primary">
              创建第一个问卷
            </Link>
          </div>
        </div>
      ) : (
        <div className="survey-list">
          {surveys.map(survey => (
            <div key={survey.id} className="survey-item">
              <div className="page-header" style={{ marginBottom: '10px' }}>
                <div>
                  <h3>{survey.title}</h3>
                  {survey.description && <p>{survey.description}</p>}
                </div>
                <span className={`status-badge ${survey.is_published ? 'status-published' : 'status-draft'}`}>
                  {survey.is_published ? '已发布' : '草稿'}
                </span>
              </div>

              <div className="survey-meta">
                <span>创建时间: {formatDate(survey.created_at)}</span>
                {survey.deadline && <span>截止时间: {formatDate(survey.deadline)}</span>}
                <span>提交数: {survey.submission_count}</span>
                {survey.max_submissions && <span>最大提交: {survey.max_submissions}</span>}
              </div>

              <div className="btn-group">
                {!survey.is_published ? (
                  <Link to={`/edit/${survey.id}`} className="btn btn-secondary btn-sm">
                    编辑
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/survey/${survey.id}`;
                      navigator.clipboard.writeText(link);
                      alert('链接已复制到剪贴板');
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    复制填写链接
                  </button>
                )}
                <Link to={`/stats/${survey.id}`} className="btn btn-success btn-sm">
                  查看统计
                </Link>
                <button
                  onClick={() => handlePublish(survey)}
                  className={`btn btn-sm ${survey.is_published ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {survey.is_published ? '取消发布' : '发布'}
                </button>
                {!survey.is_published && (
                  <button
                    onClick={() => handleDelete(survey.id)}
                    disabled={deleteId === survey.id}
                    className="btn btn-danger btn-sm"
                  >
                    {deleteId === survey.id ? '删除中...' : '删除'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
