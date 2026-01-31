import React, { useState, useEffect } from 'react';

const MacroEconomicSimulator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [inputMode, setInputMode] = useState('slider');
  const [naturalInput, setNaturalInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [showConsensus, setShowConsensus] = useState(false);
  
  // 현재 실제 경제 지표 (API에서 가져온 것처럼)
  const currentIndicators = {
    exchangeRate: { value: 1380, unit: '₩/$', name: '원/달러 환율', trend: 'up' },
    baseRate: { value: 3.50, unit: '%', name: '기준금리', trend: 'stable' },
    cpi: { value: 3.2, unit: '%', name: '소비자물가 상승률', trend: 'down' },
    gdpGrowth: { value: 2.1, unit: '%', name: 'GDP 성장률', trend: 'up' },
    unemployment: { value: 3.7, unit: '%', name: '실업률', trend: 'stable' },
    oilPrice: { value: 78, unit: '$', name: '국제유가 (WTI)', trend: 'up' }
  };

  // 사용자가 설정한 시뮬레이션 값
  const [simValues, setSimValues] = useState({
    exchangeRate: 1380,
    baseRate: 3.50,
    cpi: 3.2,
    gdpGrowth: 2.1,
    unemployment: 3.7,
    oilPrice: 78
  });

  const indicatorRanges = {
    exchangeRate: { min: 1100, max: 1600, step: 10 },
    baseRate: { min: 0, max: 7, step: 0.25 },
    cpi: { min: -1, max: 10, step: 0.1 },
    gdpGrowth: { min: -5, max: 10, step: 0.1 },
    unemployment: { min: 1, max: 15, step: 0.1 },
    oilPrice: { min: 30, max: 150, step: 1 }
  };

  const agents = [
    {
      id: 'consumer',
      name: '소비자',
      role: 'Consumer Representative',
      color: '#10b981',
      icon: '👤',
      perspective: '가계 경제 관점',
      thinking: '환율 상승으로 인해 수입품 가격이 오르고, 해외여행 비용이 증가합니다. 특히 에너지와 식료품 가격 상승이 실질 구매력을 약화시킬 것으로 보입니다. 다만 금리 인상 시 예금 이자 수익은 증가할 수 있습니다.',
      position: '소비 위축 우려'
    },
    {
      id: 'business',
      name: '기업',
      role: 'Corporate Sector',
      color: '#3b82f6',
      icon: '🏢',
      perspective: '기업 경영 관점',
      thinking: '수출 기업에게 환율 상승은 가격 경쟁력 제고의 기회입니다. 그러나 원자재 수입 비용 증가와 금리 인상에 따른 자금 조달 비용 상승은 부담 요인입니다. 업종별로 명암이 갈릴 것으로 예상됩니다.',
      position: '업종별 차별화'
    },
    {
      id: 'government',
      name: '정부',
      role: 'Fiscal Authority',
      color: '#8b5cf6',
      icon: '🏛',
      perspective: '재정 정책 관점',
      thinking: '물가 안정과 경기 부양 사이의 균형이 필요합니다. 취약계층 지원을 위한 선별적 재정 지출을 검토하되, 재정 건전성도 고려해야 합니다. 환율 급등 시 외환시장 안정화 조치를 준비하고 있습니다.',
      position: '선별적 재정 대응'
    },
    {
      id: 'centralbank',
      name: '중앙은행',
      role: 'Monetary Authority',
      color: '#f59e0b',
      icon: '🏦',
      perspective: '통화 정책 관점',
      thinking: '환율 상승에 따른 수입 물가 상승은 인플레이션 압력을 높입니다. 물가 안정 목표(2%)를 고려할 때 기준금리 인상 압력이 존재하나, 경기 둔화 우려도 함께 살펴야 합니다. 금융 안정에도 주의를 기울이고 있습니다.',
      position: '긴축 기조 유지'
    },
    {
      id: 'bank',
      name: '시중은행',
      role: 'Commercial Banking',
      color: '#ec4899',
      icon: '💳',
      perspective: '금융 중개 관점',
      thinking: '기준금리 인상은 예대마진 확대로 이어질 수 있으나, 대출 수요 감소와 부실 위험 증가를 동반합니다. 가계부채 연착륙을 위한 리스크 관리가 중요하며, 기업 대출 심사도 강화할 필요가 있습니다.',
      position: '리스크 관리 강화'
    }
  ];

  const getDelta = (key) => {
    const current = currentIndicators[key].value;
    const sim = simValues[key];
    const delta = sim - current;
    return delta;
  };

  const formatDelta = (key) => {
    const delta = getDelta(key);
    if (delta === 0) return null;
    const sign = delta > 0 ? '+' : '';
    const decimals = key === 'exchangeRate' || key === 'oilPrice' ? 0 : 1;
    return `${sign}${delta.toFixed(decimals)}`;
  };

  const handleStartSimulation = () => {
    setCurrentStep(3);
    setIsAnalyzing(true);
    
    // 에이전트별로 순차적으로 분석
    agents.forEach((agent, idx) => {
      setTimeout(() => {
        setActiveAgent(agent.id);
      }, idx * 1200);
    });

    // 모든 분석 완료 후 합의 도출
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowConsensus(true);
    }, agents.length * 1200 + 800);
  };

  return (
    <div style={styles.container}>
      {/* Subtle Grid Background */}
      <div style={styles.gridBg} />
      
      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.logo}>
            <div style={styles.logoMark}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={styles.logoText}>MacroSim</span>
          </div>
          
          <div style={styles.navSteps}>
            {['현재 상황', '시나리오 설정', '분석 & 토론', '레포트'].map((step, idx) => (
              <button
                key={idx}
                onClick={() => idx + 1 <= currentStep && setCurrentStep(idx + 1)}
                style={{
                  ...styles.navStep,
                  ...(currentStep === idx + 1 ? styles.navStepActive : {}),
                  ...(currentStep > idx + 1 ? styles.navStepCompleted : {}),
                  cursor: idx + 1 <= currentStep ? 'pointer' : 'default'
                }}
              >
                <span style={{
                  ...styles.navStepNumber,
                  ...(currentStep >= idx + 1 ? styles.navStepNumberActive : {})
                }}>
                  {currentStep > idx + 1 ? '✓' : idx + 1}
                </span>
                <span style={styles.navStepLabel}>{step}</span>
              </button>
            ))}
          </div>

          <div style={styles.navRight}>
            <button style={styles.navButton}>히스토리</button>
          </div>
        </div>
      </nav>

      <main style={styles.main}>
        {/* Step 1: Current Economic Situation */}
        {currentStep === 1 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <p style={styles.sectionLabel}>STEP 01</p>
                <h1 style={styles.sectionTitle}>현재 경제 상황</h1>
                <p style={styles.sectionDesc}>
                  실시간 경제 지표를 확인하고 시뮬레이션을 시작하세요
                </p>
              </div>
              <div style={styles.liveIndicator}>
                <span style={styles.liveDot} />
                <span>Live Data</span>
              </div>
            </div>

            <div style={styles.indicatorGrid}>
              {Object.entries(currentIndicators).map(([key, data], idx) => (
                <div 
                  key={key} 
                  style={{
                    ...styles.indicatorCard,
                    animationDelay: `${idx * 0.08}s`
                  }}
                >
                  <div style={styles.indicatorHeader}>
                    <span style={styles.indicatorName}>{data.name}</span>
                    <span style={{
                      ...styles.indicatorTrend,
                      color: data.trend === 'up' ? '#10b981' : data.trend === 'down' ? '#ef4444' : '#6b7280'
                    }}>
                      {data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '→'}
                    </span>
                  </div>
                  <div style={styles.indicatorValue}>
                    <span style={styles.indicatorNumber}>{data.value.toLocaleString()}</span>
                    <span style={styles.indicatorUnit}>{data.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.ctaContainer}>
              <button 
                onClick={() => setCurrentStep(2)}
                style={styles.primaryButton}
              >
                시나리오 설정하기
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginLeft: '8px' }}>
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </section>
        )}

        {/* Step 2: Scenario Setting */}
        {currentStep === 2 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <p style={styles.sectionLabel}>STEP 02</p>
                <h1 style={styles.sectionTitle}>시나리오 설정</h1>
                <p style={styles.sectionDesc}>
                  경제 지표를 조정하여 가상의 시나리오를 만들어보세요
                </p>
              </div>
            </div>

            {/* Input Mode Toggle */}
            <div style={styles.modeToggleContainer}>
              <div style={styles.modeToggle}>
                <button
                  onClick={() => setInputMode('slider')}
                  style={{
                    ...styles.modeButton,
                    ...(inputMode === 'slider' ? styles.modeButtonActive : {})
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                    <path d="M21 6H3M21 12H9M21 18H9M5 10V14M5 16V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  슬라이더
                </button>
                <button
                  onClick={() => setInputMode('natural')}
                  style={{
                    ...styles.modeButton,
                    ...(inputMode === 'natural' ? styles.modeButtonActive : {})
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  자연어
                </button>
              </div>
            </div>

            {inputMode === 'slider' ? (
              <div style={styles.sliderGrid}>
                {Object.entries(currentIndicators).map(([key, data], idx) => {
                  const range = indicatorRanges[key];
                  const delta = getDelta(key);
                  const deltaFormatted = formatDelta(key);
                  const percentage = ((simValues[key] - range.min) / (range.max - range.min)) * 100;
                  
                  return (
                    <div 
                      key={key} 
                      style={{
                        ...styles.sliderCard,
                        animationDelay: `${idx * 0.06}s`
                      }}
                    >
                      <div style={styles.sliderHeader}>
                        <span style={styles.sliderName}>{data.name}</span>
                        {deltaFormatted && (
                          <span style={{
                            ...styles.deltaTag,
                            background: delta > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: delta > 0 ? '#ef4444' : '#10b981'
                          }}>
                            {deltaFormatted} {data.unit}
                          </span>
                        )}
                      </div>
                      
                      <div style={styles.sliderValueRow}>
                        <div style={styles.sliderCurrentValue}>
                          <span style={styles.sliderCurrentLabel}>현재</span>
                          <span style={styles.sliderCurrentNumber}>{data.value.toLocaleString()}</span>
                        </div>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: '#4b5563' }}>
                          <path d="M5 12H19M19 12L15 8M19 12L15 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div style={styles.sliderSimValue}>
                          <span style={styles.sliderSimLabel}>시뮬레이션</span>
                          <span style={{
                            ...styles.sliderSimNumber,
                            color: delta !== 0 ? '#fff' : '#9ca3af'
                          }}>
                            {simValues[key].toLocaleString()}
                            <span style={styles.sliderUnit}>{data.unit}</span>
                          </span>
                        </div>
                      </div>

                      <div style={styles.sliderWrapper}>
                        <div style={styles.sliderTrack}>
                          <div style={{
                            ...styles.sliderFill,
                            width: `${percentage}%`
                          }} />
                          {/* Current value marker */}
                          <div style={{
                            ...styles.currentMarker,
                            left: `${((data.value - range.min) / (range.max - range.min)) * 100}%`
                          }}>
                            <div style={styles.currentMarkerLine} />
                            <span style={styles.currentMarkerLabel}>현재</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={range.min}
                          max={range.max}
                          step={range.step}
                          value={simValues[key]}
                          onChange={(e) => setSimValues({
                            ...simValues,
                            [key]: parseFloat(e.target.value)
                          })}
                          style={styles.sliderInput}
                        />
                      </div>

                      <div style={styles.sliderRange}>
                        <span>{range.min.toLocaleString()}</span>
                        <span>{range.max.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={styles.naturalInputContainer}>
                <div style={styles.naturalInputWrapper}>
                  <textarea
                    value={naturalInput}
                    onChange={(e) => setNaturalInput(e.target.value)}
                    placeholder="예: 환율이 1,500원까지 오르고 유가가 100달러를 돌파하는 상황을 가정해줘"
                    style={styles.naturalInput}
                  />
                  <div style={styles.naturalInputFooter}>
                    <span style={styles.naturalInputHint}>
                      AI가 입력을 분석하여 지표를 자동으로 설정합니다
                    </span>
                    <button style={styles.naturalInputButton}>
                      분석하기
                    </button>
                  </div>
                </div>
                
                <div style={styles.examplePrompts}>
                  <p style={styles.exampleLabel}>예시 시나리오</p>
                  <div style={styles.exampleGrid}>
                    {[
                      '미국 기준금리가 0.5%p 인상되면?',
                      '국제유가 배럴당 120달러 돌파 시',
                      '한국 GDP 성장률 1%대 진입 시나리오',
                      '환율 1,450원 + 기준금리 4% 복합 상황'
                    ].map((example, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setNaturalInput(example)}
                        style={styles.exampleButton}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Summary Bar */}
            <div style={styles.summaryBar}>
              <div style={styles.summaryChanges}>
                <span style={styles.summaryLabel}>변경된 지표</span>
                <div style={styles.summaryTags}>
                  {Object.entries(currentIndicators).map(([key, data]) => {
                    const deltaFormatted = formatDelta(key);
                    if (!deltaFormatted) return null;
                    const delta = getDelta(key);
                    return (
                      <span 
                        key={key}
                        style={{
                          ...styles.summaryTag,
                          borderColor: delta > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                          color: delta > 0 ? '#fca5a5' : '#6ee7b7'
                        }}
                      >
                        {data.name} {deltaFormatted}
                      </span>
                    );
                  })}
                  {Object.entries(currentIndicators).every(([key]) => !formatDelta(key)) && (
                    <span style={styles.summaryEmpty}>지표를 조정해주세요</span>
                  )}
                </div>
              </div>
              <button 
                onClick={handleStartSimulation}
                style={{
                  ...styles.primaryButton,
                  opacity: Object.entries(currentIndicators).some(([key]) => formatDelta(key)) ? 1 : 0.5
                }}
                disabled={Object.entries(currentIndicators).every(([key]) => !formatDelta(key))}
              >
                분석 시작
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginLeft: '8px' }}>
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </section>
        )}

        {/* Step 3: Analysis & Debate */}
        {currentStep === 3 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <p style={styles.sectionLabel}>STEP 03</p>
                <h1 style={styles.sectionTitle}>분석 & 토론</h1>
                <p style={styles.sectionDesc}>
                  각 경제 주체가 시나리오를 분석하고 의견을 나눕니다
                </p>
              </div>
              {isAnalyzing && (
                <div style={styles.analyzingIndicator}>
                  <div style={styles.analyzingSpinner} />
                  <span>분석 중...</span>
                </div>
              )}
            </div>

            {/* Agents Grid */}
            <div style={styles.agentsGrid}>
              {agents.map((agent, idx) => {
                const isActive = activeAgent === agent.id;
                const isCompleted = agents.findIndex(a => a.id === activeAgent) > idx;
                
                return (
                  <div 
                    key={agent.id}
                    style={{
                      ...styles.agentCard,
                      ...(isActive ? styles.agentCardActive : {}),
                      ...(isCompleted ? styles.agentCardCompleted : {}),
                      borderColor: isActive ? agent.color : isCompleted ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                      animationDelay: `${idx * 0.1}s`
                    }}
                  >
                    <div style={styles.agentHeader}>
                      <div style={{
                        ...styles.agentIcon,
                        background: isActive || isCompleted ? `${agent.color}20` : 'rgba(255,255,255,0.03)'
                      }}>
                        <span style={{ fontSize: '24px' }}>{agent.icon}</span>
                      </div>
                      <div style={styles.agentInfo}>
                        <h3 style={{
                          ...styles.agentName,
                          color: isActive ? agent.color : isCompleted ? '#fff' : '#6b7280'
                        }}>{agent.name}</h3>
                        <p style={styles.agentRole}>{agent.role}</p>
                      </div>
                      {isCompleted && (
                        <div style={{
                          ...styles.agentStatus,
                          background: agent.color
                        }}>✓</div>
                      )}
                      {isActive && (
                        <div style={styles.agentTyping}>
                          <span style={styles.typingDot} />
                          <span style={{ ...styles.typingDot, animationDelay: '0.2s' }} />
                          <span style={{ ...styles.typingDot, animationDelay: '0.4s' }} />
                        </div>
                      )}
                    </div>

                    {(isActive || isCompleted) && (
                      <div style={{
                        ...styles.agentContent,
                        opacity: isCompleted ? 1 : 0.8
                      }}>
                        <div style={styles.agentPerspective}>
                          <span style={{
                            ...styles.perspectiveTag,
                            background: `${agent.color}15`,
                            color: agent.color
                          }}>
                            {agent.perspective}
                          </span>
                        </div>
                        <p style={styles.agentThinking}>{agent.thinking}</p>
                        <div style={styles.agentPosition}>
                          <span style={styles.positionLabel}>입장</span>
                          <span style={{
                            ...styles.positionValue,
                            color: agent.color
                          }}>{agent.position}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Consensus Section */}
            {showConsensus && (
              <div style={styles.consensusSection}>
                <div style={styles.consensusHeader}>
                  <div style={styles.consensusIcon}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h2 style={styles.consensusTitle}>합의점 도출</h2>
                    <p style={styles.consensusSubtitle}>5개 경제 주체의 종합 의견</p>
                  </div>
                </div>

                <div style={styles.consensusContent}>
                  <div style={styles.verdictBox}>
                    <span style={styles.verdictLabel}>종합 전망</span>
                    <span style={styles.verdictValue}>단기 부정적, 중기 중립</span>
                  </div>
                  
                  <p style={styles.consensusText}>
                    환율 상승은 <strong>수출 기업의 가격 경쟁력</strong>을 일시적으로 높이나, 
                    <strong>수입 물가 상승</strong>으로 인한 소비자 부담 증가와 
                    <strong>인플레이션 압력</strong>이 더 큰 영향을 미칠 것으로 예상됩니다.
                    중앙은행의 <strong>긴축 기조 유지</strong>가 예상되며, 
                    정부의 선별적 재정 지원이 경기 하방 리스크를 일부 완화할 것으로 보입니다.
                  </p>

                  <div style={styles.impactGrid}>
                    <div style={styles.impactCard}>
                      <span style={styles.impactEmoji}>📉</span>
                      <span style={styles.impactLabel}>소비</span>
                      <span style={{...styles.impactValue, color: '#ef4444'}}>위축 예상</span>
                    </div>
                    <div style={styles.impactCard}>
                      <span style={styles.impactEmoji}>📊</span>
                      <span style={styles.impactLabel}>투자</span>
                      <span style={{...styles.impactValue, color: '#f59e0b'}}>업종별 차별화</span>
                    </div>
                    <div style={styles.impactCard}>
                      <span style={styles.impactEmoji}>💵</span>
                      <span style={styles.impactLabel}>금리</span>
                      <span style={{...styles.impactValue, color: '#ef4444'}}>인상 압력</span>
                    </div>
                    <div style={styles.impactCard}>
                      <span style={styles.impactEmoji}>📈</span>
                      <span style={styles.impactLabel}>물가</span>
                      <span style={{...styles.impactValue, color: '#ef4444'}}>상승 전망</span>
                    </div>
                  </div>
                </div>

                <div style={styles.consensusActions}>
                  <button style={styles.secondaryButton}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                      <path d="M4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8.342C20 8.07556 19.9467 7.81181 19.8433 7.56624C19.7399 7.32068 19.5885 7.09824 19.398 6.912L14.958 2.57C14.5844 2.20466 14.0826 2.00007 13.56 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4Z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M14 2V6C14 6.53043 14.2107 7.03914 14.5858 7.41421C14.9609 7.78929 15.4696 8 16 8H20" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    PDF 레포트 다운로드
                  </button>
                  <button 
                    onClick={() => setCurrentStep(4)}
                    style={styles.primaryButton}
                  >
                    상세 레포트 보기
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginLeft: '8px' }}>
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Step 4: Report */}
        {currentStep === 4 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <p style={styles.sectionLabel}>STEP 04</p>
                <h1 style={styles.sectionTitle}>분석 레포트</h1>
                <p style={styles.sectionDesc}>
                  시뮬레이션 결과에 대한 종합 보고서입니다
                </p>
              </div>
              <div style={styles.reportActions}>
                <button style={styles.iconButton}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12C9 11.518 8.886 11.062 8.684 10.658M8.684 13.342C8.305 14.036 7.69 14.574 6.957 14.862M8.684 13.342L15.316 10.658M8.684 10.658C8.305 9.964 7.69 9.426 6.957 9.138M8.684 10.658L15.316 13.342M15.316 10.658C15.695 9.964 16.31 9.426 17.043 9.138M15.316 10.658C15.114 11.062 15 11.518 15 12C15 12.482 15.114 12.938 15.316 13.342M15.316 13.342C15.695 14.036 16.31 14.574 17.043 14.862" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </button>
                <button style={styles.iconButton}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div style={styles.reportContainer}>
              <div style={styles.reportSidebar}>
                <p style={styles.reportSidebarLabel}>목차</p>
                <nav style={styles.reportNav}>
                  {['개요', '시나리오 설정', '주체별 분석', '종합 전망', '리스크 요인', '정책 제언'].map((item, idx) => (
                    <a key={idx} href="#" style={{
                      ...styles.reportNavItem,
                      ...(idx === 0 ? styles.reportNavItemActive : {})
                    }}>
                      <span style={styles.reportNavNumber}>{String(idx + 1).padStart(2, '0')}</span>
                      {item}
                    </a>
                  ))}
                </nav>
              </div>

              <div style={styles.reportContent}>
                <div style={styles.reportMeta}>
                  <span>생성일: 2025년 1월 25일</span>
                  <span>•</span>
                  <span>시뮬레이션 ID: SIM-2025-0125-001</span>
                </div>

                <article style={styles.reportArticle}>
                  <h2 style={styles.reportH2}>1. 개요</h2>
                  <p style={styles.reportP}>
                    본 보고서는 원/달러 환율 1,500원 돌파 시나리오에 대한 다자간 경제 분석 결과를 담고 있습니다. 
                    소비자, 기업, 정부, 중앙은행, 시중은행 등 5개 경제 주체의 관점에서 시나리오를 분석하고, 
                    각 주체 간 토론을 통해 도출된 합의점을 정리하였습니다.
                  </p>

                  <h2 style={styles.reportH2}>2. 시나리오 설정</h2>
                  <div style={styles.reportTable}>
                    <div style={styles.reportTableHeader}>
                      <span>지표</span>
                      <span>현재 값</span>
                      <span>시뮬레이션 값</span>
                      <span>변화</span>
                    </div>
                    {Object.entries(currentIndicators).map(([key, data]) => {
                      const delta = getDelta(key);
                      const deltaFormatted = formatDelta(key);
                      return (
                        <div key={key} style={styles.reportTableRow}>
                          <span>{data.name}</span>
                          <span>{data.value.toLocaleString()} {data.unit}</span>
                          <span>{simValues[key].toLocaleString()} {data.unit}</span>
                          <span style={{
                            color: delta > 0 ? '#ef4444' : delta < 0 ? '#10b981' : '#6b7280'
                          }}>
                            {deltaFormatted || '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <h2 style={styles.reportH2}>3. 주체별 분석</h2>
                  {agents.map((agent) => (
                    <div key={agent.id} style={styles.reportAgentSection}>
                      <h3 style={{
                        ...styles.reportH3,
                        color: agent.color
                      }}>
                        {agent.icon} {agent.name} ({agent.role})
                      </h3>
                      <p style={styles.reportP}>{agent.thinking}</p>
                      <div style={styles.reportAgentPosition}>
                        <strong>입장:</strong> {agent.position}
                      </div>
                    </div>
                  ))}
                </article>
              </div>
            </div>
          </section>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          scroll-behavior: smooth;
        }

        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 4px rgba(255,255,255,0.1);
          margin-top: -8px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 12px rgba(0,0,0,0.4), 0 0 0 6px rgba(255,255,255,0.15);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #fff;
          border-radius: 50%;
          border: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        textarea::placeholder {
          color: #6b7280;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes typing {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }

        .fadeIn {
          animation: fadeIn 0.5s ease forwards;
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#09090b',
    color: '#fafafa',
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    position: 'relative',
    overflow: 'hidden'
  },
  gridBg: {
    position: 'fixed',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
    `,
    backgroundSize: '64px 64px',
    pointerEvents: 'none'
  },

  // Navigation
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(9, 9, 11, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)'
  },
  navInner: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 48px',
    height: '72px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoMark: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff'
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 600,
    letterSpacing: '-0.02em'
  },
  navSteps: {
    display: 'flex',
    gap: '8px'
  },
  navStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    color: '#6b7280',
    fontSize: '14px',
    fontFamily: 'inherit',
    cursor: 'default',
    transition: 'all 0.2s ease'
  },
  navStepActive: {
    background: 'rgba(255,255,255,0.05)',
    color: '#fff'
  },
  navStepCompleted: {
    color: '#9ca3af'
  },
  navStepNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600
  },
  navStepNumberActive: {
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: '#fff'
  },
  navStepLabel: {
    fontWeight: 500
  },
  navRight: {
    display: 'flex',
    gap: '12px'
  },
  navButton: {
    padding: '10px 20px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#9ca3af',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  // Main
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 48px'
  },

  // Section
  section: {
    padding: '64px 0 120px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '48px'
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#3b82f6',
    letterSpacing: '0.1em',
    marginBottom: '8px'
  },
  sectionTitle: {
    fontSize: '36px',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    marginBottom: '12px',
    background: 'linear-gradient(135deg, #fff 0%, #9ca3af 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  sectionDesc: {
    fontSize: '16px',
    color: '#6b7280',
    lineHeight: 1.6
  },

  // Live Indicator
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#10b981'
  },
  liveDot: {
    width: '8px',
    height: '8px',
    background: '#10b981',
    borderRadius: '50%',
    animation: 'pulse 2s ease-in-out infinite'
  },

  // Indicator Grid (Step 1)
  indicatorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '48px'
  },
  indicatorCard: {
    padding: '28px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    animation: 'fadeIn 0.5s ease forwards',
    opacity: 0,
    transition: 'all 0.2s ease'
  },
  indicatorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  indicatorName: {
    fontSize: '14px',
    color: '#9ca3af',
    fontWeight: 500
  },
  indicatorTrend: {
    fontSize: '16px',
    fontWeight: 600
  },
  indicatorValue: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px'
  },
  indicatorNumber: {
    fontSize: '32px',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    fontFamily: "'JetBrains Mono', monospace"
  },
  indicatorUnit: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: 500
  },

  // CTA
  ctaContainer: {
    display: 'flex',
    justifyContent: 'center'
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 24px rgba(59, 130, 246, 0.25)'
  },
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 32px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  iconButton: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#9ca3af',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  // Mode Toggle (Step 2)
  modeToggleContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '40px'
  },
  modeToggle: {
    display: 'flex',
    padding: '4px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)'
  },
  modeButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  modeButtonActive: {
    background: 'rgba(255,255,255,0.08)',
    color: '#fff'
  },

  // Slider Grid (Step 2)
  sliderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginBottom: '32px'
  },
  sliderCard: {
    padding: '28px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    animation: 'fadeIn 0.5s ease forwards',
    opacity: 0
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sliderName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#e5e5e5'
  },
  deltaTag: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace"
  },
  sliderValueRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px'
  },
  sliderCurrentValue: {
    textAlign: 'left'
  },
  sliderCurrentLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  sliderCurrentNumber: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#6b7280',
    fontFamily: "'JetBrains Mono', monospace"
  },
  sliderSimValue: {
    textAlign: 'right'
  },
  sliderSimLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#3b82f6',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  sliderSimNumber: {
    fontSize: '28px',
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace"
  },
  sliderUnit: {
    fontSize: '14px',
    color: '#6b7280',
    marginLeft: '4px'
  },
  sliderWrapper: {
    position: 'relative',
    height: '40px',
    marginBottom: '8px'
  },
  sliderTrack: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: '4px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '2px',
    transform: 'translateY(-50%)'
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    borderRadius: '2px'
  },
  currentMarker: {
    position: 'absolute',
    top: '-8px',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  currentMarkerLine: {
    width: '2px',
    height: '20px',
    background: '#f59e0b',
    borderRadius: '1px'
  },
  currentMarkerLabel: {
    marginTop: '4px',
    fontSize: '9px',
    color: '#f59e0b',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  sliderInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    margin: 0,
    cursor: 'pointer'
  },
  sliderRange: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#4b5563',
    fontFamily: "'JetBrains Mono', monospace"
  },

  // Natural Input (Step 2)
  naturalInputContainer: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  naturalInputWrapper: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '32px'
  },
  naturalInput: {
    width: '100%',
    padding: '24px',
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    fontFamily: 'inherit',
    lineHeight: 1.7,
    resize: 'none',
    minHeight: '160px',
    outline: 'none'
  },
  naturalInputFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.01)'
  },
  naturalInputHint: {
    fontSize: '13px',
    color: '#6b7280'
  },
  naturalInputButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer'
  },
  examplePrompts: {
    marginBottom: '48px'
  },
  exampleLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '16px',
    fontWeight: 500
  },
  exampleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px'
  },
  exampleButton: {
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
    color: '#9ca3af',
    fontSize: '14px',
    fontFamily: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  // Summary Bar
  summaryBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 32px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px'
  },
  summaryChanges: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: 500
  },
  summaryTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  summaryTag: {
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: "'JetBrains Mono', monospace"
  },
  summaryEmpty: {
    fontSize: '14px',
    color: '#4b5563',
    fontStyle: 'italic'
  },

  // Analyzing Indicator
  analyzingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    background: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#3b82f6'
  },
  analyzingSpinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(59, 130, 246, 0.2)',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },

  // Agents Grid (Step 3)
  agentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '16px',
    marginBottom: '48px'
  },
  agentCard: {
    padding: '24px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '16px',
    animation: 'fadeIn 0.5s ease forwards',
    opacity: 0,
    transition: 'all 0.3s ease'
  },
  agentCardActive: {
    background: 'rgba(255,255,255,0.04)'
  },
  agentCardCompleted: {
    background: 'rgba(255,255,255,0.03)'
  },
  agentHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '20px',
    position: 'relative'
  },
  agentIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  agentInfo: {
    flex: 1,
    minWidth: 0
  },
  agentName: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '4px',
    transition: 'color 0.3s ease'
  },
  agentRole: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  agentStatus: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 700
  },
  agentTyping: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center'
  },
  typingDot: {
    width: '6px',
    height: '6px',
    background: '#3b82f6',
    borderRadius: '50%',
    animation: 'typing 1s ease-in-out infinite'
  },
  agentContent: {
    transition: 'opacity 0.3s ease'
  },
  agentPerspective: {
    marginBottom: '12px'
  },
  perspectiveTag: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.03em'
  },
  agentThinking: {
    fontSize: '13px',
    color: '#9ca3af',
    lineHeight: 1.7,
    marginBottom: '16px'
  },
  agentPosition: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.06)'
  },
  positionLabel: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  positionValue: {
    fontSize: '13px',
    fontWeight: 600
  },

  // Consensus Section
  consensusSection: {
    padding: '40px',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05))',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    animation: 'fadeIn 0.6s ease forwards'
  },
  consensusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px'
  },
  consensusIcon: {
    width: '56px',
    height: '56px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff'
  },
  consensusTitle: {
    fontSize: '24px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: '4px'
  },
  consensusSubtitle: {
    fontSize: '14px',
    color: '#6b7280'
  },
  consensusContent: {
    marginBottom: '32px'
  },
  verdictBox: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '10px',
    marginBottom: '24px'
  },
  verdictLabel: {
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  verdictValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#f59e0b'
  },
  consensusText: {
    fontSize: '16px',
    color: '#d1d5db',
    lineHeight: 1.8,
    marginBottom: '32px'
  },
  impactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px'
  },
  impactCard: {
    padding: '20px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px'
  },
  impactEmoji: {
    fontSize: '28px'
  },
  impactLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: 500
  },
  impactValue: {
    fontSize: '14px',
    fontWeight: 600
  },
  consensusActions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'flex-end'
  },

  // Report (Step 4)
  reportActions: {
    display: 'flex',
    gap: '8px'
  },
  reportContainer: {
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
    gap: '48px'
  },
  reportSidebar: {
    position: 'sticky',
    top: '120px',
    alignSelf: 'start'
  },
  reportSidebarLabel: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '16px'
  },
  reportNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  reportNavItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    color: '#6b7280',
    fontSize: '14px',
    textDecoration: 'none',
    transition: 'all 0.2s ease'
  },
  reportNavItemActive: {
    background: 'rgba(255,255,255,0.05)',
    color: '#fff'
  },
  reportNavNumber: {
    fontSize: '11px',
    color: '#4b5563',
    fontFamily: "'JetBrains Mono', monospace"
  },
  reportContent: {
    minWidth: 0
  },
  reportMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '40px',
    paddingBottom: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)'
  },
  reportArticle: {
    maxWidth: '720px'
  },
  reportH2: {
    fontSize: '22px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: '20px',
    marginTop: '48px',
    color: '#fff'
  },
  reportH3: {
    fontSize: '17px',
    fontWeight: 600,
    marginBottom: '12px',
    marginTop: '32px'
  },
  reportP: {
    fontSize: '15px',
    color: '#a1a1aa',
    lineHeight: 1.8,
    marginBottom: '20px'
  },
  reportTable: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '32px'
  },
  reportTableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 100px',
    gap: '16px',
    padding: '16px 24px',
    background: 'rgba(255,255,255,0.03)',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  reportTableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 100px',
    gap: '16px',
    padding: '16px 24px',
    fontSize: '14px',
    color: '#d1d5db',
    borderTop: '1px solid rgba(255,255,255,0.04)'
  },
  reportAgentSection: {
    padding: '24px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    marginBottom: '16px'
  },
  reportAgentPosition: {
    fontSize: '14px',
    color: '#9ca3af',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.06)'
  }
};

export default MacroEconomicSimulator;
