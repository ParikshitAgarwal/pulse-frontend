import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import './DashboardPage.css';
import { useAuth } from '../context/AuthContext';

const STATUS_FILTERS = ['all', 'processing', 'safe', 'flagged'];

function formatDurationSeconds(totalSeconds) {
  const sec = Number(totalSeconds);
  if (sec < 0) return '—';
  if (sec === 0) return '0 s';

  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  const parts = [];
  if (h > 0) parts.push(`${h} ${h === 1 ? 'hr' : 'hrs'}`);
  if (m > 0) parts.push(`${m} ${m === 1 ? 'min' : 'mins'}`);
  if (s > 0 || parts.length === 0) parts.push(`${s} s`);

  return parts.join(' ');
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth()

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await api.get('/videos', { params });
      setVideos(res.data);
    } catch (err) {
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const deleteVideo = async (id) => {
    try {
       setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      await api.delete(`/videos/${id}`, { params });
      fetchVideos();
    } catch (error) {
      setError('Failed to Delete video');
      
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchVideos(); }, [filter]);

  useEffect(() => {
    const hasProcessing = videos.some(v => v.status === 'processing');
    if (!hasProcessing) return;
    const interval = setInterval(fetchVideos, 5000);
    return () => clearInterval(interval);
  }, [videos]);

  const formatSize = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <>
      <Navbar />
      <div className="page-wrapper">

        <div className="page-header">
          <div>
            <h1 className="page-title">Video Library</h1>
            <p className="page-sub">{videos.length} video{videos.length !== 1 ? 's' : ''} in your organisation</p>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="state-box">
            <div className="spinner-dark" />
            <p>Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="state-box">
            <p className="state-title">No videos found</p>
            <p className="state-sub">
              {filter !== 'all' ? `No ${filter} videos` : 'Upload your first video to get started'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="video-table-wrap desktop-only">
              <table className="video-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Size</th>
                    <th>Duration</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map(video => (
                    <tr key={video._id} className="video-row">
                      <td>
                        <span className="video-title-cell">{video.title}</span>
                        <span className="video-filename">{video.originalName}</span>
                      </td>
                      <td>
                        <StatusBadge status={video.status} progress={video.processingProgress} />
                      </td>
                      <td className="text-muted">{formatSize(video.size)}</td>
                      <td className="text-muted">{formatDurationSeconds(video.duration)}</td>
                      <td className="text-muted">{video.uploadedBy?.name || '—'}</td>
                      <td className="text-muted">{formatDate(video.createdAt)}</td>
                      <td>
                        <button
                          className="btn-view"
                          onClick={() => navigate(`/video/${video._id}`)}
                          disabled={video.status === 'processing' || video.status === 'uploading'}
                        >
                          View
                        </button>
                      </td>
                      {user.role != 'viewer' ? <td>
                        <button
                          className="btn-delete"
                          onClick={() => deleteVideo(video._id)}
                        >
                          Delete
                        </button>
                      </td> : ''

                      }
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="video-cards mobile-only">
              {videos.map(video => (
                <div key={video._id} className="video-card">
                  <div className="video-card-top">
                    <div className="video-card-info">
                      <span className="video-title-cell">{video.title}</span>
                      <span className="video-filename">{video.originalName}</span>
                    </div>
                    <StatusBadge status={video.status} progress={video.processingProgress} />
                  </div>

                  <div className="video-card-meta">
                    <div className="card-meta-item">
                      <span className="card-meta-label">Size</span>
                      <span className="card-meta-value">{formatSize(video.size)}</span>
                    </div>
                    <div className="card-meta-item">
                      <span className="card-meta-label">Duration</span>
                      <span className="card-meta-value">
                        {formatDurationSeconds(video.duration)}
                      </span>
                    </div>
                    <div className="card-meta-item">
                      <span className="card-meta-label">By</span>
                      <span className="card-meta-value">{video.uploadedBy?.name || '—'}</span>
                    </div>
                    <div className="card-meta-item">
                      <span className="card-meta-label">Date</span>
                      <span className="card-meta-value">{formatDate(video.createdAt)}</span>
                    </div>
                  </div>

                  <button
                    className="btn-view-full"
                    onClick={() => navigate(`/video/${video._id}`)}
                    disabled={video.status === 'processing' || video.status === 'uploading'}
                  >
                    View Video →
                  </button>
                  {user.role != 'viewer' ?
                    <button
                      className="btn-delete-full"
                      onClick={() => deleteVideo(video._id)}
                    >
                      Delete
                    </button>
                    : ''

                  }
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function StatusBadge({ status, progress }) {
  const map = {
    uploading: { label: 'Uploading', cls: 'status-processing' },
    processing: { label: `Processing ${progress}%`, cls: 'status-processing' },
    safe: { label: 'Safe', cls: 'status-safe' },
    flagged: { label: 'Flagged', cls: 'status-flagged' },
    error: { label: 'Error', cls: 'status-error' },
  };
  const { label, cls } = map[status] || { label: status, cls: '' };
  return <span className={`status-badge ${cls}`}>{label}</span>;
}