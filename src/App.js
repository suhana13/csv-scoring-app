import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import netlifyIdentity from 'netlify-identity-widget';

// Initialize Netlify Identity
netlifyIdentity.init();

function App() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  // Data states
  const [csvData, setCsvData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  
  // Set up Netlify Identity listeners
  useEffect(() => {
    // Check if user is already logged in
    const currentUser = netlifyIdentity.currentUser();
    if (currentUser) {
      setIsAuthenticated(true);
      setUser(currentUser);
      loadCSV();
    }

    // Add login listener
    netlifyIdentity.on('login', user => {
      setIsAuthenticated(true);
      setUser(user);
      netlifyIdentity.close();
      loadCSV();
    });

    // Add logout listener
    netlifyIdentity.on('logout', () => {
      setIsAuthenticated(false);
      setUser(null);
    });

    // Cleanup listeners on component unmount
    return () => {
      netlifyIdentity.off('login');
      netlifyIdentity.off('logout');
    };
  }, []);

  const handleLogin = () => {
    netlifyIdentity.open('login');
  };

  const handleLogout = () => {
    netlifyIdentity.logout();
  };

  const loadCSV = () => {
    setIsLoading(true);
    
    fetch('/sample-data.csv')
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, { header: true });
        setCsvData(result.data);
        
        // Initialize scores array with empty scores for each row
        const initialScores = result.data.map(row => ({
          id: row.id || Math.random().toString(36).substr(2, 9),
          score: null,
          notes: ''
        }));
        setScores(initialScores);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading CSV:', error);
        setIsLoading(false);
      });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvText = event.target.result;
        const result = Papa.parse(csvText, { header: true });
        setCsvData(result.data);
        
        // Initialize scores array
        const initialScores = result.data.map(row => ({
          id: row.id || Math.random().toString(36).substr(2, 9),
          score: null,
          notes: ''
        }));
        setScores(initialScores);
        setCurrentIndex(0); // Reset to first item
      };
      reader.readAsText(file);
    }
  };

  const handleScore = (score) => {
    const updatedScores = [...scores];
    updatedScores[currentIndex].score = score;
    setScores(updatedScores);
  };

  const handleNotes = (e) => {
    const updatedScores = [...scores];
    updatedScores[currentIndex].notes = e.target.value;
    setScores(updatedScores);
  };

  const nextItem = () => {
    if (currentIndex < csvData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevItem = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const exportScores = () => {
    // Prepare data for export
    const dataToExport = scores.map((scoreItem, index) => ({
      ...csvData[index],
      score: scoreItem.score,
      notes: scoreItem.notes
    }));
    
    // Convert to CSV
    const csv = Papa.unparse(dataToExport);
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'scored_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('Scores exported! In a complete app, this would also be saved to the server.');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">CSV Scoring App</h1>
          <p className="mb-6 text-center">Please log in to access the scoring application.</p>
          <button 
            onClick={handleLogin} 
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Login with Netlify Identity
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">CSV Scoring App</h1>
          <div className="flex items-center">
            <span className="mr-4">Logged in as: {user.email}</span>
            <button 
              onClick={handleLogout} 
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Upload your own CSV:</h3>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload} 
            className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
          />
          {csvFile && <p className="mt-2 text-sm text-gray-600">Using file: {csvFile.name}</p>}
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading data...</div>
        ) : csvData.length > 0 ? (
          <div>
            <div className="mb-6 p-4 border rounded bg-gray-50">
              <h2 className="text-lg font-semibold mb-4">
                Item {currentIndex + 1} of {csvData.length}
              </h2>
              
              {/* Display the current item data */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {Object.entries(csvData[currentIndex]).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <span className="font-medium">{key}: </span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>

              {/* Scoring interface */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">Score this item:</h3>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      onClick={() => handleScore(score)}
                      className={`w-10 h-10 rounded-full ${
                        scores[currentIndex].score === score 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes field */}
              <div className="mb-4">
                <label className="block font-medium mb-2">Notes:</label>
                <textarea
                  value={scores[currentIndex].notes}
                  onChange={handleNotes}
                  className="w-full p-2 border rounded"
                  rows="3"
                />
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between">
                <button
                  onClick={prevItem}
                  disabled={currentIndex === 0}
                  className={`px-4 py-2 rounded ${
                    currentIndex === 0 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={nextItem}
                  disabled={currentIndex === csvData.length - 1}
                  className={`px-4 py-2 rounded ${
                    currentIndex === csvData.length - 1 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>

            {/* Export button */}
            <div className="text-center">
              <button
                onClick={exportScores}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                Export Scores
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p>No data available. Please upload a CSV file.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;