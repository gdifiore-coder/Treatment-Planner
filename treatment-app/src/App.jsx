import { useState, useMemo } from 'react'
import treatmentData from './data/treatmentData.json'
import './App.css'

// Demographics configuration
const DEMOGRAPHICS = {
  child: {
    label: 'Children',
    description: 'Child Psychotherapy Treatment Planner',
    color: '#4CAF50'
  },
  adolescent: {
    label: 'Adolescents',
    description: 'Adolescent Psychotherapy Treatment Planner',
    color: '#2196F3'
  },
  sexualAbuse: {
    label: 'Sexual Abuse/Offenses',
    description: 'Sexual Abuse Victim and Sexual Offender Treatment Planner',
    color: '#9C27B0'
  }
}

function App() {
  const [selectedDemographic, setSelectedDemographic] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)

  // Get problems for selected demographic
  const problems = useMemo(() => {
    if (!selectedDemographic) return []
    return treatmentData[selectedDemographic] || []
  }, [selectedDemographic])

  // Filter problems based on search query
  const filteredProblems = useMemo(() => {
    if (!searchQuery.trim()) return problems
    const query = searchQuery.toLowerCase()
    return problems.filter(p => {
      // Search in problem title
      if (p.problem.toLowerCase().includes(query)) return true
      // Search in definitions (symptoms)
      if (p.definitions.some(d => d.toLowerCase().includes(query))) return true
      // Search in diagnoses
      if (p.diagnoses.some(d =>
        d.code.toLowerCase().includes(query) ||
        d.name.toLowerCase().includes(query)
      )) return true
      return false
    })
  }, [problems, searchQuery])

  const handleDemographicSelect = (demo) => {
    setSelectedDemographic(demo)
    setSelectedProblem(null)
    setSearchQuery('')
  }

  const handleProblemSelect = (problem) => {
    setSelectedProblem(problem)
    setSearchQuery(problem.problem)
    setShowDropdown(false)
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setShowDropdown(true)
    if (!e.target.value) {
      setSelectedProblem(null)
    }
  }

  const handleBackToDemo = () => {
    setSelectedDemographic(null)
    setSelectedProblem(null)
    setSearchQuery('')
  }

  const handleClearSelection = () => {
    setSelectedProblem(null)
    setSearchQuery('')
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Treatment Planner</h1>
        <p>Evidence-Based Intervention Database</p>
      </header>

      {/* Demographic Selection */}
      {!selectedDemographic ? (
        <div className="demographic-selection">
          <h2>Select Age Demographic / Population</h2>
          <div className="demographic-cards">
            {Object.entries(DEMOGRAPHICS).map(([key, demo]) => (
              <button
                key={key}
                className="demographic-card"
                style={{ '--accent-color': demo.color }}
                onClick={() => handleDemographicSelect(key)}
              >
                <h3>{demo.label}</h3>
                <p>{demo.description}</p>
                <span className="problem-count">
                  {treatmentData[key]?.length || 0} conditions
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="main-content">
          {/* Navigation */}
          <div className="nav-bar">
            <button className="back-btn" onClick={handleBackToDemo}>
              ← Back to Demographics
            </button>
            <div className="current-demo" style={{ '--accent-color': DEMOGRAPHICS[selectedDemographic].color }}>
              {DEMOGRAPHICS[selectedDemographic].label}
            </div>
          </div>

          {/* Search Section */}
          <div className="search-section">
            <h2>Search Symptoms / Diagnoses</h2>
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Type to search (e.g., anxiety, depression, ADHD...)"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowDropdown(true)}
              />
              {searchQuery && (
                <button className="clear-btn" onClick={handleClearSelection}>
                  ×
                </button>
              )}

              {/* Autocomplete Dropdown */}
              {showDropdown && searchQuery && filteredProblems.length > 0 && !selectedProblem && (
                <div className="autocomplete-dropdown">
                  {filteredProblems.slice(0, 10).map((problem, idx) => (
                    <button
                      key={idx}
                      className="dropdown-item"
                      onClick={() => handleProblemSelect(problem)}
                    >
                      <span className="problem-title">{problem.problem}</span>
                      <span className="intervention-count">
                        {problem.interventions.length} interventions
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Select Buttons */}
            {!selectedProblem && (
              <div className="quick-select">
                <h4>Quick Select:</h4>
                <div className="quick-select-grid">
                  {problems.slice(0, 12).map((problem, idx) => (
                    <button
                      key={idx}
                      className="quick-btn"
                      onClick={() => handleProblemSelect(problem)}
                    >
                      {problem.problem}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          {selectedProblem && (
            <div className="results-section">
              <div className="problem-header">
                <h2>{selectedProblem.problem}</h2>
                <div className="stats">
                  <span className="stat">{selectedProblem.definitions.length} symptoms</span>
                  <span className="stat">{selectedProblem.interventions.length} interventions</span>
                  <span className="stat">{selectedProblem.diagnoses.length} diagnoses</span>
                </div>
              </div>

              {/* Behavioral Definitions / Symptoms */}
              {selectedProblem.definitions.length > 0 && (
                <div className="section">
                  <h3>Behavioral Definitions / Symptoms</h3>
                  <ul className="definition-list">
                    {selectedProblem.definitions.map((def, idx) => (
                      <li key={idx}>{def}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Treatment Goals */}
              {selectedProblem.goals.length > 0 && (
                <div className="section">
                  <h3>Long-Term Goals</h3>
                  <ul className="goals-list">
                    {selectedProblem.goals.map((goal, idx) => (
                      <li key={idx}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Therapeutic Interventions */}
              {selectedProblem.interventions.length > 0 && (
                <div className="section interventions-section">
                  <h3>Therapeutic Interventions</h3>
                  <div className="interventions-list">
                    {selectedProblem.interventions.map((intervention, idx) => (
                      <div key={idx} className="intervention-card">
                        <span className="intervention-number">{idx + 1}</span>
                        <p>{intervention}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnostic Suggestions */}
              {selectedProblem.diagnoses.length > 0 && (
                <div className="section">
                  <h3>Diagnostic Suggestions (DSM-5/ICD-10)</h3>
                  <div className="diagnoses-grid">
                    {selectedProblem.diagnoses.map((diag, idx) => (
                      <div key={idx} className="diagnosis-card">
                        <span className="diag-code">{diag.code}</span>
                        <span className="diag-name">{diag.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <footer className="footer">
        <p>Based on Wiley PracticePlanners Series</p>
        <p>For clinical reference only. Professional judgment required.</p>
      </footer>
    </div>
  )
}

export default App
