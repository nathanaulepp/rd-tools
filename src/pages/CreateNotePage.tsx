<div className="app-layout">
      {/* SIDEBAR */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          RD Workstation
          <button className="close-sidebar-btn" onClick={() => setSidebarOpen(false)}>×</button>
        </div>
        
        <div className="nav-section">
          <div className={`nav-item ${activeDomain === "A" ? 'active' : ''}`} onClick={() => handleDomainSwitch("A")}>A. Anthropometrics</div>
          <div className={`nav-item ${activeDomain === "B" ? 'active' : ''}`} onClick={() => handleDomainSwitch("B")}>B. Biochemical Data</div>
          <div className={`nav-item ${activeDomain === "C" ? 'active' : ''}`} onClick={() => handleDomainSwitch("C")}>C. Clinical & NFPE</div>
          <div className={`nav-item ${activeDomain === "D" ? 'active' : ''}`} onClick={() => handleDomainSwitch("D")}>D. Dietary History</div>
          
          {activeDomain === "D" && (
            <div className="sub-nav">
              {DIETARY_CATEGORIES.map(cat => (
                <div key={cat.id} className={`sub-nav-item ${activeSubDomain === cat.id ? 'active' : ''}`} onClick={() => setActiveSubDomain(cat.id)}>
                  {cat.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* MAIN WORKSPACE */}
      <main className="main-workspace">
        <header className="top-nav">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="search-bar-container">
            <span className="search-icon">🔍</span>
            <input type="text" className="search-bar" placeholder="Jump to section..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button className="exit-workspace-btn" onClick={handleExitToStart}>Exit Note</button>
        </header>

        <div className="content-area">
          {activeDomain === "A" && (
            <AnthroDomain 
              anthro={anthro} 
              setAnthro={setAnthro} 
              dexaScans={dexaScans} 
              setDexaScans={setDexaScans} 
              calculatedMetrics={calculatedMetrics} 
              patientData={patientData} /* <-- Pass patientData here too! */
            />
          )}
          {activeDomain === "B" && <BiochemicalDomain labs={labs} setLabs={setLabs} />}
          {activeDomain === "C" && <ClinicalDomain clinical={clinical} setClinical={setClinical} />}
          {activeDomain === "D" && <DietaryDomain dietary={dietary} setDietary={setDietary} activeSubDomain={activeSubDomain} />}
        </div>
      </main>
    </div>