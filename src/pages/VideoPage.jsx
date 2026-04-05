import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import './VideoPage.css';

export default function VideoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  // const baseUrl = config.SOCKET_URL

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await api.get(`/videos/${id}`);
        setVideo(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [id]);

  const formatSize = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  // Stream URL — token in query param for video element (can't set headers on <video>)
  // const streamUrl = `${baseUrl}/videos/${id}/stream?token=${localStorage.getItem('token')}`;
  const streamUrl = video?.path
  if (loading) return (
    <>
      <Navbar />
      <div className="page-wrapper center-state">
        <div className="spinner-dark" />
        <p>Loading video...</p>
      </div>
    </>
  );

  if (error) return (
    <>
      <Navbar />
      <div className="page-wrapper center-state">
        <p className="error-text">{error}</p>
        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
    </>
  );

  const details = video.sensitivityDetails || {};
  const scores = [
    { label: 'Violence', val: details.violenceScore },
    { label: 'Adult', val: details.adultContentScore },
    { label: 'Hate Speech', val: details.hateSpeechScore },
    { label: 'Spam', val: details.spamScore },
    { label: 'Copyright', val: details.copyrightScore },
  ].filter(s => s.val !== undefined);

  return (
    <>
      <Navbar />
      <div className="page-wrapper">

        {/* Back */}
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>

        <div className="video-layout">

          {/* Left — player */}
          <div className="video-left">
            <div className="player-wrap">
              <video
                ref={videoRef}
                controls
                className="video-player"
                src={streamUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="video-meta-card">
              <div className="video-meta-header">
                <div>
                  <h1 className="video-title">{video.title}</h1>
                  <p className="video-filename">{video.originalName}</p>
                </div>
                <span className={`status-badge status-${video.status}`}>
                  {video.status}
                </span>
              </div>

              <div className="video-meta-grid">
                <MetaItem label="File Size" value={formatSize(video.size)} />
                <MetaItem label="Uploaded By" value={video.uploadedBy?.name || '—'} />
                <MetaItem label="Organisation" value={video.organisation} />
                <MetaItem label="Uploaded On" value={formatDate(video.createdAt)} />
                <MetaItem label="Format" value={video.mimetype} />
                <MetaItem label="Severity" value={details.severity || '—'} />
              </div>
            </div>
          </div>

          {/* Right — sensitivity report */}
          <div className="video-right">
            <div className="report-card">
              <h3 className="report-title">Sensitivity Report</h3>

              {video.status === 'processing' ? (
                <div className="report-processing">
                  <div className="spinner-dark" />
                  <p>Analysis in progress...</p>
                  <p className="report-sub">{video.processingProgress}% complete</p>
                </div>
              ) : (
                <>
                  {/* Overall score */}
                  <div className={`overall-score ${video.status === 'flagged' ? 'flagged' : 'safe'}`}>
                    <div className="overall-icon">
                      {video.status === 'flagged' ? '🚩' : '✅'}
                    </div>
                    <div>
                      <div className="overall-label">
                        {video.status === 'flagged' ? 'Content Flagged' : 'Content Safe'}
                      </div>
                      <div className="overall-val">
                        {video.sensitivityScore
                          ? `${(video.sensitivityScore * 100).toFixed(0)}% sensitivity score`
                          : 'No score available'}
                      </div>
                    </div>
                  </div>

                  {/* Sub scores */}
                  {scores.length > 0 && (
                    <div className="sub-scores">
                      <p className="sub-scores-title">Category Breakdown</p>
                      {scores.map(({ label, val }) => (
                        <div key={label} className="score-row">
                          <span className="score-label">{label}</span>
                          <div className="score-bar-wrap">
                            <div
                              className={`score-bar-fill ${val > 0.55 ? 'bar-red' : val > 0.3 ? 'bar-amber' : 'bar-green'}`}
                              style={{ width: `${(val * 100).toFixed(0)}%` }}
                            />
                          </div>
                          <span className="score-val">{(val * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Severity */}
                  {details.severity && (
                    <div className="severity-row">
                      <span className="severity-label">Severity Level</span>
                      <span className={`severity-badge severity-${details.severity}`}>
                        {details.severity}
                      </span>
                    </div>
                  )}

                  {/* Analyzed at */}
                  {details.analyzedAt && (
                    <p className="analyzed-at">
                      Analyzed {formatDate(details.analyzedAt)}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="meta-item">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{value}</span>
    </div>
  );
}