<template>
  <div class="panel scan-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="title-icon">🔍</span>
        漏洞扫描
      </h3>
      <div class="header-info">
        <div v-if="selectedTarget" class="target-info">
          <span class="target-name">{{ selectedTarget.name || selectedTarget.ip }}</span>
          <span class="vulnerability-count" :class="getVulnerabilityLevel(vulnerabilityStats.critical + vulnerabilityStats.high)">
            {{ vulnerabilityStats.total }} 个漏洞
          </span>
        </div>
      </div>
    </div>

    <div class="panel-content">
      <!-- 无目标状态 -->
      <div v-if="!selectedTarget" class="no-target-state">
        <div class="state-icon">🎯</div>
        <p class="state-text">请先选择扫描目标</p>
        <p class="state-hint">从左侧目标列表中选择一个目标进行漏洞扫描</p>
      </div>

      <!-- 有目标但无扫描结果 -->
      <div v-else-if="!hasScanResults && !isScanning" class="no-scan-state">
        <div class="state-icon">🔍</div>
        <p class="state-text">暂无扫描数据</p>
        <button class="start-scan-btn" @click="startScan">
          <span class="btn-icon">🚀</span>
          开始扫描
        </button>
      </div>

      <!-- 扫描中状态 -->
      <div v-else-if="isScanning" class="scanning-state">
        <div class="scanning-animation">
          <div class="scan-radar">
            <div class="radar-sweep"></div>
            <div class="radar-dots">
              <div class="dot" v-for="i in 8" :key="i" :style="getDotStyle(i)"></div>
            </div>
          </div>
        </div>
        <p class="scanning-text">正在扫描 {{ selectedTarget.ip }}...</p>
        <p class="scanning-progress">进度: {{ scanProgress }}%</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${scanProgress}%` }"></div>
        </div>
        <button class="cancel-scan-btn" @click="cancelScan">
          取消扫描
        </button>
      </div>

      <!-- 扫描结果 -->
      <div v-else class="scan-results">
        <!-- 雷达图 -->
        <div class="radar-section">
          <div class="section-header">
            <h4>漏洞雷达图</h4>
            <div class="chart-controls">
              <button
                  class="refresh-btn"
                  @click="refreshScan"
                  :disabled="isRefreshing"
                  title="刷新扫描"
              >
                <span class="btn-icon" :class="{ spinning: isRefreshing }">🔄</span>
              </button>
            </div>
          </div>
          <div ref="radarChartRef" class="radar-chart"></div>
        </div>

        <!-- 漏洞统计 -->
        <div class="stats-section">
          <div class="stats-grid">
            <div class="stat-card critical">
              <div class="stat-icon">🔴</div>
              <div class="stat-info">
                <div class="stat-value">{{ vulnerabilityStats.critical }}</div>
                <div class="stat-label">严重</div>
              </div>
            </div>
            <div class="stat-card high">
              <div class="stat-icon">🟠</div>
              <div class="stat-info">
                <div class="stat-value">{{ vulnerabilityStats.high }}</div>
                <div class="stat-label">高危</div>
              </div>
            </div>
            <div class="stat-card medium">
              <div class="stat-icon">🟡</div>
              <div class="stat-info">
                <div class="stat-value">{{ vulnerabilityStats.medium }}</div>
                <div class="stat-label">中危</div>
              </div>
            </div>
            <div class="stat-card low">
              <div class="stat-icon">🟢</div>
              <div class="stat-info">
                <div class="stat-value">{{ vulnerabilityStats.low }}</div>
                <div class="stat-label">低危</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 漏洞详情列表 -->
        <div class="vulnerabilities-section">
          <div class="section-header">
            <h4>漏洞详情</h4>
            <div class="section-controls">
              <select v-model="severityFilter" class="severity-filter">
                <option value="">全部级别</option>
                <option value="critical">严重</option>
                <option value="high">高危</option>
                <option value="medium">中危</option>
                <option value="low">低危</option>
              </select>
            </div>
          </div>

          <div class="vulnerabilities-list">
            <div
                v-for="vulnerability in filteredVulnerabilities"
                :key="vulnerability.id"
                class="vulnerability-item"
                :class="vulnerability.severity"
                @click="selectVulnerability(vulnerability)"
            >
              <div class="vuln-severity">
                <div class="severity-badge" :class="vulnerability.severity">
                  {{ getSeverityIcon(vulnerability.severity) }}
                </div>
              </div>

              <div class="vuln-info">
                <div class="vuln-header">
                  <h5 class="vuln-type">{{ vulnerability.type }}</h5>
                  <span class="cvss-score">CVSS: {{ vulnerability.cvss }}</span>
                </div>
                <p class="vuln-description">{{ vulnerability.description }}</p>
              </div>

              <div class="vuln-expand">
                <span class="expand-icon">
                  {{ selectedVulnerability?.id === vulnerability.id ? '▼' : '▶' }}
                </span>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="filteredVulnerabilities.length === 0" class="empty-vulnerabilities">
              <div class="empty-icon">🔍</div>
              <p>没有找到相应级别的漏洞</p>
            </div>
          </div>
        </div>

        <!-- 漏洞详细信息 -->
        <Transition name="slide-down">
          <div v-if="selectedVulnerability" class="vulnerability-details">
            <div class="details-header">
              <div class="vuln-title">
                <span class="severity-badge" :class="selectedVulnerability.severity">
                  {{ getSeverityIcon(selectedVulnerability.severity) }}
                </span>
                <h4>{{ selectedVulnerability.type }}</h4>
              </div>
              <button class="close-details" @click="selectedVulnerability = null">×</button>
            </div>

            <div class="details-content">
              <div class="detail-section">
                <h5>描述</h5>
                <p>{{ selectedVulnerability.description }}</p>
              </div>

              <div class="detail-section">
                <h5>风险评分</h5>
                <div class="cvss-info">
                  <span class="cvss-score-large">{{ selectedVulnerability.cvss }}</span>
                  <span class="cvss-level">{{ getCvssLevel(selectedVulnerability.cvss) }}</span>
                </div>
              </div>

              <div class="detail-section">
                <h5>修复建议</h5>
                <p class="recommendation">{{ selectedVulnerability.recommendation }}</p>
              </div>

              <div class="detail-actions">
                <button class="action-btn ignore-btn" @click="ignoreVulnerability(selectedVulnerability)">
                  <span class="btn-icon">👁️‍🗨️</span>
                  标记为已知
                </button>
                <button class="action-btn fix-btn" @click="markAsFixed(selectedVulnerability)">
                  <span class="btn-icon">✅</span>
                  标记为已修复
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- 扫描历史 -->
        <div class="history-section">
          <div class="section-header">
            <h4>扫描历史</h4>
          </div>
          <div class="scan-history">
            <div
                v-for="scan in scanHistory"
                :key="scan.id"
                class="history-item"
                @click="loadHistoryScan(scan)"
            >
              <div class="history-time">
                {{ formatTime(scan.timestamp, 'short') }}
              </div>
              <div class="history-stats">
                <span class="history-count critical">{{ scan.critical || 0 }}</span>
                <span class="history-count high">{{ scan.high || 0 }}</span>
                <span class="history-count medium">{{ scan.medium || 0 }}</span>
                <span class="history-count low">{{ scan.low || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>