// Add this state in your App component
const [csvFile, setCsvFile] = useState(null);

// Add this function to your App component
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

// Add this JSX inside your app, perhaps right above the item display section:
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