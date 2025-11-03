import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const StressMonitor = () => {
  const [stressScore, setStressScore] = useState(null);
  const [sensorData, setSensorData] = useState({ HRV: null, SpO2: null });
  const [history, setHistory] = useState([]);
  const [lastIndex, setLastIndex] = useState(null);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await axios.get('http://localhost:8000/history');
      console.log('History loaded:', response.data);
      
      if (response.data && response.data.history) {
        setHistory(response.data.history);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const simulatePredict = async () => {
    const data = {
      HRV: Math.floor(Math.random() * 51) + 40,
      SpO2: Math.random() * 8 + 92,
    };

    try {
      const response = await axios.post('http://localhost:8000/predict', data);
      setStressScore(response.data.stress_score);
      setSensorData(data);

      // Get the index of the newly added row from backend response
      const newIndex = response.data.new_index;
      console.log('New prediction saved at index:', newIndex);
      setLastIndex(newIndex);  // Set immediately with the correct index

      // Reload history to show the new point
      await loadHistory();
      
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const submitFeedback = async (feedback) => {
    // Get the most recent index if not set
    if (lastIndex === null && history.length > 0) {
      setLastIndex(history[history.length - 1].index);
    }

    if (lastIndex === null) {
      alert('Please simulate a reading first');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/feedback', {
        index: lastIndex,
        feedback: feedback
      });
      
      // Show detailed confirmation
      alert(`✅ Feedback "${feedback}" recorded!\nRow Index: ${response.data.index}\nNew Stress Score: ${response.data.new_score}`);
      
      await loadHistory();
    } catch (error) {
      alert('Feedback error: ' + error.message);
      console.error('Feedback error:', error);
    }
  };

  // Chart data
  const chartData = {
    labels: history.map((entry, idx) => entry.Timestamp || `#${idx + 1}`),
    datasets: [
      {
        label: 'HRV (ms)',
        data: history.map((entry) => entry.HRV_Denormalized || 0),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        yAxisID: 'y',
        tension: 0.3,
      },
      {
        label: 'SpO₂ (%)',
        data: history.map((entry) => entry.Oxygen_Saturation || 0),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        yAxisID: 'y1',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: 15,
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'HRV (ms)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'SpO₂ (%)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div style={{ margin: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h2>Stress Monitor</h2>
      
      <button 
        onClick={simulatePredict}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          marginBottom: '20px',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
        }}
      >
        Simulate New Reading
      </button>

      {stressScore !== null && (
        <div style={{ 
          padding: '20px', 
          marginBottom: '20px', 
          border: '2px solid #007bff', 
          borderRadius: '10px',
          backgroundColor: '#f8f9fa'
        }}>
          <h3 style={{ marginTop: 0 }}>Latest Prediction</h3>
          <p style={{ fontSize: '2.5rem', color: '#007bff', margin: '10px 0', fontWeight: 'bold' }}>
            Stress Score: {stressScore.toFixed(3)}
          </p>
          <div style={{ marginBottom: '15px' }}>
            <span style={{ fontSize: '1.2rem', marginRight: '20px' }}>
              <strong>HRV:</strong> {sensorData.HRV} ms
            </span>
            <span style={{ fontSize: '1.2rem' }}>
              <strong>SpO₂:</strong> {sensorData.SpO2.toFixed(2)}%
            </span>
          </div>
          
          <h4 style={{ marginBottom: '10px' }}>Provide Feedback:</h4>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => submitFeedback('bad')} 
              style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              😰 Bad (1.0)
            </button>
            <button 
              onClick={() => submitFeedback('poor')} 
              style={{ padding: '10px 20px', background: '#fd7e14', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              😟 Poor (0.75)
            </button>
            <button 
              onClick={() => submitFeedback('average')} 
              style={{ padding: '10px 20px', background: '#ffc107', color: 'black', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              😐 Average (0.50)
            </button>
            <button 
              onClick={() => submitFeedback('good')} 
              style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🙂 Good (0.25)
            </button>
            <button 
              onClick={() => submitFeedback('very_good')} 
              style={{ padding: '10px 20px', background: '#20c997', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              😊 Very Good (0.1)
            </button>
          </div>
        </div>
      )}

      {history.length > 0 ? (
        <div style={{ marginTop: '20px' }}>
          <h3>HRV & SpO₂ History (Last {history.length} readings)</h3>
          <div style={{ height: '450px', marginTop: '15px', border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px', backgroundColor: '#e9ecef', borderRadius: '8px', marginTop: '20px' }}>
          <p style={{ margin: 0 }}>No data loaded. Click "Simulate New Reading" or check backend connection.</p>
          <button 
            onClick={loadHistory} 
            style={{ padding: '8px 16px', marginTop: '10px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Retry Loading History
          </button>
        </div>
      )}
    </div>
  );
};

export default StressMonitor;
