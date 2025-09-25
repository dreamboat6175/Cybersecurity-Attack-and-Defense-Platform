/* 头部操作 */
.header-actions {
display: flex;
align-items: center;
justify-content: center;
gap: var(--spacing-sm);
}

.target-count {
background-color: var(--color-text-accent);
color: var(--color-bg-primary);
padding: var(--spacing-xs) var(--spacing-sm);
border-radius: var(--border-radius-sm);
font-size: var(--font-size-xs);
font-weight: 600;
}

.add-target-btn {
background: none;
border: 1px solid var(--color-border);
color: var(--color-text-secondary);
width: 32px;
height: 32px;
border-radius: var(--border-radius-sm);
cursor: pointer;
transition: all var(--transition-base);
display: flex;
align-items: center;
justify-content: center;
}