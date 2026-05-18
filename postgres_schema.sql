CREATE TABLE workflows (
	id VARCHAR(36) NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	halt_reason VARCHAR(50), 
	started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	completed_at TIMESTAMP WITHOUT TIME ZONE, 
	request_hash VARCHAR(64), 
	retry_count INTEGER NOT NULL, 
	last_retry_at TIMESTAMP WITHOUT TIME ZONE, 
	max_retry_limit INTEGER NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE zone_status (
	zone_id VARCHAR(10) NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	active_crisis VARCHAR(50), 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (zone_id)
);

CREATE TABLE crises (
	id VARCHAR(36) NOT NULL, 
	workflow_id VARCHAR(36) NOT NULL, 
	crisis_type VARCHAR(50) NOT NULL, 
	severity VARCHAR(20) NOT NULL, 
	confidence FLOAT NOT NULL, 
	affected_zone VARCHAR(10), 
	affected_roads TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(workflow_id) REFERENCES workflows (id)
);

CREATE TABLE executions (
	id VARCHAR(36) NOT NULL, 
	workflow_id VARCHAR(36) NOT NULL, 
	ticket_id VARCHAR(50), 
	execution_type VARCHAR(50) NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	recipients_count INTEGER, 
	executed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(workflow_id) REFERENCES workflows (id)
);

CREATE TABLE logs (
	id VARCHAR(36) NOT NULL, 
	workflow_id VARCHAR(36), 
	agent_name VARCHAR(60) NOT NULL, 
	message TEXT NOT NULL, 
	timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	trace_id VARCHAR(36), 
	execution_ms INTEGER, 
	parent_agent VARCHAR(60), 
	PRIMARY KEY (id), 
	FOREIGN KEY(workflow_id) REFERENCES workflows (id)
);

CREATE TABLE response_plans (
	id VARCHAR(36) NOT NULL, 
	workflow_id VARCHAR(36) NOT NULL, 
	action TEXT NOT NULL, 
	priority INTEGER NOT NULL, 
	department VARCHAR(100) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(workflow_id) REFERENCES workflows (id)
);

CREATE TABLE signals (
	id VARCHAR(36) NOT NULL, 
	workflow_id VARCHAR(36) NOT NULL, 
	social_signals TEXT, 
	weather_json TEXT, 
	traffic_json TEXT, 
	rainfall_mm FLOAT, 
	aqi FLOAT, 
	visibility_km FLOAT, 
	congestion_ratio FLOAT, 
	avg_speed_kmh FLOAT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(workflow_id) REFERENCES workflows (id)
);

