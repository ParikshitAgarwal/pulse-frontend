import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import './UploadPage.css';

const MAX_SIZE = 100 * 1024 * 1024; // 100MB

export default function UploadPage() {
  const navigate = useNavigate();
  const { watchVideo, onProgress, onComplete } = useSocket();

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  // Processing state (driven by socket)
  const [phase, setPhase] = useState('idle'); // idle | uploading | processing | done
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);  // final sensitivity result
  const [videoId, setVideoId] = useState(null);

  // Register socket listeners once
  useEffect(() => {
    const offProgress = onProgress((data) => {
      if (videoId && data.videoId !== videoId) return;
      setProgress(data.progress);
      setMessage(data.message);
      setPhase('processing');
    });

    const offComplete = onComplete((data) => {
      if (videoId && data.videoId !== videoId) return;
      setProgress(100);
      setPhase('done');
      setResult(data);
    });

    return () => { offProgress(); offComplete(); };
  }, [videoId]);

  const onDrop = useCallback((accepted, rejected) => {
    setError('');
    if (rejected.length > 0) {
      const reason = rejected[0].errors[0].code;
      if (reason === 'file-too-large') return setError('File too large. Max size is 100MB.');
      if (reason === 'file-invalid-type') return setError('Invalid file type. Upload MP4, WebM, or MOV.');
      return setError('File rejected.');
    }
    const f = accepted[0];
    setFile(f);
    setTitle(f.name.replace(/\.[^/.]+$/, '')); // strip extension as default title
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/mp4': [], 'video/webm': [], 'video/quicktime': [], 'video/ogg': [] },
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: uploading || phase === 'processing',
  });

  const handleUpload = async () => {
    if (!file) return setError('Please select a video file.');
    if (!title.trim()) return setError('Please enter a title.');
    setError('');
    setUploading(true);
    setPhase('uploading');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title.trim());

    try {
      const res = await api.post('/videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setUploadPct(pct);
        },
      });

      const id = res.data.video._id;
      setVideoId(id);
      watchVideo(id);         // join socket room immediately
      setPhase('processing');
      setMessage('Starting analysis...');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
      setPhase('idle');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setTitle('');
    setError('');
    setPhase('idle');
    setProgress(0);
    setMessage('');
    setResult(null);
    setVideoId(null);
    setUploadPct(0);
  };

  const formatSize = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="page-header">
          <div>
            <h1 className="page-title">Upload Video</h1>
            <p className="page-sub">Supported formats: MP4, WebM, MOV · Max 100MB</p>
          </div>
        </div>

        <div className="upload-layout">
          {/* Left — form */}
          <div className="upload-left">

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`dropzone ${isDragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''} ${phase !== 'idle' ? 'disabled' : ''}`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="file-preview">
                  <div className="file-icon">🎬</div>
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatSize(file.size)}</span>
                  </div>
                  {phase === 'idle' && (
                    <button className="file-remove" onClick={(e) => { e.stopPropagation(); setFile(null); }}>✕</button>
                  )}
                </div>
              ) : (
                <div className="dropzone-content">
                  <div className="dropzone-icon">📁</div>
                  <p className="dropzone-text">
                    {isDragActive ? 'Drop it here...' : 'Drag & drop a video, or click to browse'}
                  </p>
                  <span className="dropzone-hint">MP4, WebM, MOV up to 100MB</span>
                </div>
              )}
            </div>

            {/* Title input */}
            <div className="form-field" style={{ marginTop: 16 }}>
              <label>Video Title</label>
              <input
                type="text"
                placeholder="Enter video title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={phase !== 'idle'}
                className="text-input"
              />
            </div>

            {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}

            {/* Actions */}
            <div className="upload-actions">
              {phase === 'idle' || phase === 'uploading' ? (
                <button
                  className="btn-primary"
                  onClick={handleUpload}
                  disabled={!file || uploading}
                >
                  {uploading ? `Uploading ${uploadPct}%...` : 'Upload & Analyze'}
                </button>
              ) : phase === 'done' ? (
                <div className="action-row">
                  <button className="btn-primary" onClick={() => navigate(`/video/${videoId}`)}>
                    View Video →
                  </button>
                  <button className="btn-secondary" onClick={handleReset}>
                    Upload Another
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right — progress panel */}
          <div className="upload-right">
            <div className="progress-card">
              <h3 className="progress-card-title">Analysis Status</h3>

              {phase === 'idle' && (
                <div className="progress-idle">
                  <p>Upload a video to begin sensitivity analysis.</p>
                </div>
              )}

              {phase === 'uploading' && (
                <div className="progress-section">
                  <div className="progress-label">
                    <span>Uploading file...</span>
                    <span>{uploadPct}%</span>
                  </div>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar-fill blue" style={{ width: `${uploadPct}%` }} />
                  </div>
                </div>
              )}

              {(phase === 'processing' || phase === 'done') && (
                <div className="progress-section">
                  <div className="progress-label">
                    <span>{message || 'Analyzing...'}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-bar-wrap">
                    <div
                      className={`progress-bar-fill ${phase === 'done' ? (result?.status === 'flagged' ? 'red' : 'green') : 'amber'}`}
                      style={{ width: `${progress}%`, transition: 'width 0.6s ease' }}
                    />
                  </div>

                  {/* Stage log */}
                  {message && phase === 'processing' && (
                    <div className="stage-log">
                      <div className="stage-entry active">
                        <span className="stage-dot" />
                        {message}
                      </div>
                    </div>
                  )}

                  {/* Result */}
                  {phase === 'done' && result && (
                    <div className={`result-box ${result.status === 'flagged' ? 'result-flagged' : 'result-safe'}`}>
                      <div className="result-header">
                        <span className="result-icon">{result.status === 'flagged' ? '🚩' : '✅'}</span>
                        <div>
                          <div className="result-status">
                            {result.status === 'flagged' ? 'Content Flagged' : 'Content Safe'}
                          </div>
                          <div className="result-score">
                            Sensitivity score: {(result.sensitivityScore * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      <div className="result-scores">
                        {[
                          { label: 'Violence', val: result.details?.violenceScore },
                          { label: 'Adult', val: result.details?.adultContentScore },
                          { label: 'Hate Speech', val: result.details?.hateSpeechScore },
                          { label: 'Spam', val: result.details?.spamScore },
                          { label: 'Copyright', val: result.details?.copyrightScore },
                        ].map(({ label, val }) => val !== undefined && (
                          <div key={label} className="score-row">
                            <span className="score-label">{label}</span>
                            <div className="score-bar-wrap">
                              <div
                                className="score-bar-fill"
                                style={{ width: `${(val * 100).toFixed(0)}%` }}
                              />
                            </div>
                            <span className="score-val">{(val * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>

                      <div className="result-severity">
                        Severity: <strong>{result.details?.severity || 'none'}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}