# Deployment Configurations - Spring Boot ML Platform

## Complete Deployment Configuration Reference

This document provides production-ready deployment configurations for all major platforms and scenarios.

## Table of Contents

1. [Docker Configurations](#docker-configurations)
2. [Kubernetes Manifests](#kubernetes-manifests)
3. [AWS Deployment](#aws-deployment)
4. [Azure Deployment](#azure-deployment)
5. [GCP Deployment](#gcp-deployment)
6. [On-Premise Deployment](#on-premise-deployment)
7. [CI/CD Pipelines](#cicd-pipelines)
8. [Configuration Management](#configuration-management)

---

## Docker Configurations

### Production Dockerfile

```dockerfile
# Multi-stage build for optimal image size
FROM gradle:8.5-jdk21 AS builder

WORKDIR /build

# Copy gradle files
COPY build.gradle.kts settings.gradle.kts ./
COPY gradle ./gradle

# Download dependencies (cached layer)
RUN gradle dependencies --no-daemon

# Copy source code
COPY src ./src

# Build application
RUN gradle bootJar --no-daemon

# Production image
FROM elide/jvm:21-jammy

LABEL maintainer="ml-platform@example.com"
LABEL description="Spring Boot ML Platform with Elide Polyglot"
LABEL version="1.0.0"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python ML libraries
COPY requirements.txt /tmp/
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt

# Create application user
RUN groupadd -r mlplatform && useradd -r -g mlplatform mlplatform

# Create directories
RUN mkdir -p /app /var/log/ml-platform /data/models && \
    chown -R mlplatform:mlplatform /app /var/log/ml-platform /data/models

WORKDIR /app

# Copy JAR from builder
COPY --from=builder /build/build/libs/*.jar app.jar

# Switch to non-root user
USER mlplatform

# Expose ports
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health/liveness || exit 1

# JVM settings
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport \
    -XX:MaxRAMPercentage=75.0 \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    -XX:+HeapDumpOnOutOfMemoryError \
    -XX:HeapDumpPath=/var/log/ml-platform/heap_dump.hprof"

# Application settings
ENV SPRING_PROFILES_ACTIVE=prod
ENV ELIDE_POLYGLOT_PYTHON_ENABLED=true

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### requirements.txt

```text
scikit-learn==1.3.2
tensorflow==2.15.0
pandas==2.1.4
numpy==1.26.2
xgboost==2.0.3
lightgbm==4.1.0
prophet==1.1.5
transformers==4.35.2
torch==2.1.2
shap==0.44.0
scipy==1.11.4
statsmodels==0.14.1
matplotlib==3.8.2
seaborn==0.13.0
```

### docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  ml-platform:
    build: .
    container_name: ml-platform
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - DB_HOST=postgres
      - DB_NAME=mlplatform
      - DB_USER=mluser
      - DB_PASSWORD=mlpass123
      - REDIS_HOST=redis
      - REDIS_PASSWORD=redispass123
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/var/log/ml-platform
      - ./models:/data/models
    networks:
      - ml-network
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    container_name: ml-postgres
    environment:
      - POSTGRES_DB=mlplatform
      - POSTGRES_USER=mluser
      - POSTGRES_PASSWORD=mlpass123
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - ml-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: ml-redis
    command: redis-server --requirepass redispass123
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - ml-network
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    container_name: ml-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - ml-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: ml-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana-dashboards:/etc/grafana/provisioning/dashboards
    networks:
      - ml-network
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:
  prometheus-data:
  grafana-data:

networks:
  ml-network:
    driver: bridge
```

### docker-compose.prod.yml (Production)

```yaml
version: '3.8'

services:
  ml-platform:
    image: registry.example.com/ml-platform:1.0.0
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      update_config:
        parallelism: 1
        delay: 30s
        failure_action: rollback
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - JAVA_OPTS=-Xmx6g -Xms4g
    secrets:
      - db_password
      - redis_password
      - api_keys
    configs:
      - source: app_config
        target: /app/config/application.yml
    networks:
      - ml-network-prod
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "10"

secrets:
  db_password:
    external: true
  redis_password:
    external: true
  api_keys:
    external: true

configs:
  app_config:
    external: true

networks:
  ml-network-prod:
    external: true
```

---

## Kubernetes Manifests

### Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ml-platform
  labels:
    name: ml-platform
    environment: production
```

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ml-platform-config
  namespace: ml-platform
data:
  application.yml: |
    spring:
      application:
        name: ml-platform-prod

      datasource:
        url: jdbc:postgresql://postgres-service:5432/mlplatform
        hikari:
          maximum-pool-size: 50
          minimum-idle: 10

      redis:
        host: redis-service
        port: 6379

      cache:
        type: redis

    elide:
      polyglot:
        python:
          enabled: true
          warm-up: true

    ml:
      models:
        cache-size: 100
        cache-ttl: 3600

    server:
      port: 8080
      compression:
        enabled: true

    management:
      endpoints:
        web:
          exposure:
            include: health,metrics,prometheus

  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s

    scrape_configs:
      - job_name: 'ml-platform'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - ml-platform
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
```

### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ml-platform-secrets
  namespace: ml-platform
type: Opaque
stringData:
  db.password: "changeme"
  redis.password: "changeme"
  aws.access.key: "changeme"
  aws.secret.key: "changeme"
```

### PersistentVolumeClaim

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ml-models-pvc
  namespace: ml-platform
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 100Gi
  storageClassName: fast-ssd
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-platform
  namespace: ml-platform
  labels:
    app: ml-platform
    version: v1.0.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ml-platform
  template:
    metadata:
      labels:
        app: ml-platform
        version: v1.0.0
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/actuator/prometheus"
    spec:
      serviceAccountName: ml-platform
      containers:
      - name: ml-platform
        image: registry.example.com/ml-platform:1.0.0
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8080
          name: http
          protocol: TCP
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
        - name: JAVA_OPTS
          value: "-Xmx6g -Xms4g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: ml-platform-config
              key: db.host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ml-platform-secrets
              key: db.password
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ml-platform-secrets
              key: redis.password
        - name: AWS_ACCESS_KEY_ID
          valueFrom:
            secretKeyRef:
              name: ml-platform-secrets
              key: aws.access.key
        - name: AWS_SECRET_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: ml-platform-secrets
              key: aws.secret.key
        resources:
          requests:
            memory: "4Gi"
            cpu: "2000m"
          limits:
            memory: "8Gi"
            cpu: "4000m"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 90
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /actuator/health
            port: 8080
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 30
        volumeMounts:
        - name: config
          mountPath: /app/config
          readOnly: true
        - name: models
          mountPath: /data/models
        - name: logs
          mountPath: /var/log/ml-platform
      volumes:
      - name: config
        configMap:
          name: ml-platform-config
      - name: models
        persistentVolumeClaim:
          claimName: ml-models-pvc
      - name: logs
        emptyDir: {}
      imagePullSecrets:
      - name: registry-credentials
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - ml-platform
              topologyKey: kubernetes.io/hostname
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ml-platform-service
  namespace: ml-platform
  labels:
    app: ml-platform
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-internal: "true"
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
  selector:
    app: ml-platform
  sessionAffinity: None
```

### HorizontalPodAutoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ml-platform-hpa
  namespace: ml-platform
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ml-platform
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
      selectPolicy: Min
```

### PodDisruptionBudget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ml-platform-pdb
  namespace: ml-platform
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: ml-platform
```

### NetworkPolicy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ml-platform-netpol
  namespace: ml-platform
spec:
  podSelector:
    matchLabels:
      app: ml-platform
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: ml-platform
    ports:
    - protocol: TCP
      port: 5432  # PostgreSQL
    - protocol: TCP
      port: 6379  # Redis
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 53   # DNS
    - protocol: UDP
      port: 53
  - to:
    - podSelector: {}
    ports:
    - protocol: TCP
      port: 443  # HTTPS
```

---

## AWS Deployment

### ECS Task Definition

```json
{
  "family": "ml-platform",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "4096",
  "memory": "8192",
  "taskRoleArn": "arn:aws:iam::123456789012:role/MLPlatformTaskRole",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ECSTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "ml-platform",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/ml-platform:1.0.0",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "SPRING_PROFILES_ACTIVE",
          "value": "prod"
        },
        {
          "name": "AWS_REGION",
          "value": "us-east-1"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:ml-platform/db-password"
        },
        {
          "name": "REDIS_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:ml-platform/redis-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ml-platform",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ml-platform"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:8080/actuator/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 90
      },
      "ulimits": [
        {
          "name": "nofile",
          "softLimit": 65536,
          "hardLimit": 65536
        }
      ],
      "mountPoints": [
        {
          "sourceVolume": "models",
          "containerPath": "/data/models"
        }
      ]
    }
  ],
  "volumes": [
    {
      "name": "models",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-abc123",
        "transitEncryption": "ENABLED",
        "authorizationConfig": {
          "iam": "ENABLED"
        }
      }
    }
  ]
}
```

### ECS Service

```json
{
  "serviceName": "ml-platform",
  "cluster": "ml-platform-cluster",
  "taskDefinition": "ml-platform:latest",
  "desiredCount": 3,
  "launchType": "FARGATE",
  "platformVersion": "LATEST",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": [
        "subnet-abc123",
        "subnet-def456",
        "subnet-ghi789"
      ],
      "securityGroups": [
        "sg-ml-platform"
      ],
      "assignPublicIp": "DISABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/ml-platform/abc123",
      "containerName": "ml-platform",
      "containerPort": 8080
    }
  ],
  "healthCheckGracePeriodSeconds": 120,
  "deploymentConfiguration": {
    "maximumPercent": 200,
    "minimumHealthyPercent": 100,
    "deploymentCircuitBreaker": {
      "enable": true,
      "rollback": true
    }
  },
  "enableECSManagedTags": true,
  "propagateTags": "SERVICE"
}
```

### CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'ML Platform Infrastructure'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues:
      - development
      - staging
      - production

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${Environment}-ml-platform-vpc

  # RDS PostgreSQL
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for ML Platform DB
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub ${Environment}-ml-platform-db
      Engine: postgres
      EngineVersion: '16.1'
      DBInstanceClass: db.r6g.2xlarge
      AllocatedStorage: 100
      StorageType: gp3
      Iops: 3000
      MasterUsername: mlplatform
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      MultiAZ: true
      BackupRetentionPeriod: 30
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      DeletionProtection: true

  # ElastiCache Redis
  CacheSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: Subnet group for ML Platform Cache
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  RedisCluster:
    Type: AWS::ElastiCache::ReplicationGroup
    Properties:
      ReplicationGroupId: !Sub ${Environment}-ml-platform-cache
      ReplicationGroupDescription: Redis cluster for ML Platform
      Engine: redis
      EngineVersion: '7.0'
      CacheNodeType: cache.r6g.xlarge
      NumCacheClusters: 3
      AutomaticFailoverEnabled: true
      MultiAZEnabled: true
      CacheSubnetGroupName: !Ref CacheSubnetGroup
      SecurityGroupIds:
        - !Ref CacheSecurityGroup
      AtRestEncryptionEnabled: true
      TransitEncryptionEnabled: true
      SnapshotRetentionLimit: 7
      SnapshotWindow: '03:00-05:00'

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub ${Environment}-ml-platform
      ClusterSettings:
        - Name: containerInsights
          Value: enabled

  # Application Load Balancer
  ALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub ${Environment}-ml-platform-alb
      Type: application
      Scheme: internal
      Subnets:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup

  # S3 Bucket for Models
  ModelsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${Environment}-ml-platform-models
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90

Outputs:
  VPCId:
    Value: !Ref VPC
    Export:
      Name: !Sub ${Environment}-ml-platform-vpc

  DatabaseEndpoint:
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub ${Environment}-ml-platform-db-endpoint

  RedisEndpoint:
    Value: !GetAtt RedisCluster.PrimaryEndPoint.Address
    Export:
      Name: !Sub ${Environment}-ml-platform-redis-endpoint
```

---

## CI/CD Pipelines

### GitHub Actions

```yaml
name: Build and Deploy ML Platform

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

env:
  REGISTRY: registry.example.com
  IMAGE_NAME: ml-platform

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up JDK 21
      uses: actions/setup-java@v4
      with:
        java-version: '21'
        distribution: 'temurin'
        cache: gradle

    - name: Run tests
      run: ./gradlew test

    - name: Generate coverage report
      run: ./gradlew jacocoTestReport

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Login to Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ secrets.REGISTRY_USERNAME }}
        password: ${{ secrets.REGISTRY_PASSWORD }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=sha

    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
    - name: Deploy to Staging
      uses: appleboy/kubectl-action@master
      with:
        kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}
        command: |
          kubectl set image deployment/ml-platform \
            ml-platform=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n ml-platform-staging
          kubectl rollout status deployment/ml-platform -n ml-platform-staging

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
    - name: Deploy to Production
      uses: appleboy/kubectl-action@master
      with:
        kubeconfig: ${{ secrets.KUBE_CONFIG_PROD }}
        command: |
          kubectl set image deployment/ml-platform \
            ml-platform=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n ml-platform
          kubectl rollout status deployment/ml-platform -n ml-platform
```

### GitLab CI

```yaml
stages:
  - test
  - build
  - deploy

variables:
  MAVEN_CLI_OPTS: "--batch-mode"
  DOCKER_DRIVER: overlay2
  IMAGE_TAG: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

test:
  stage: test
  image: gradle:8.5-jdk21
  script:
    - ./gradlew test
    - ./gradlew jacocoTestReport
  artifacts:
    reports:
      junit: build/test-results/test/TEST-*.xml
      coverage_report:
        coverage_format: cobertura
        path: build/reports/jacoco/test/jacocoTestReport.xml
  coverage: '/Total.*?([0-9]{1,3})%/'

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $IMAGE_TAG .
    - docker push $IMAGE_TAG
  only:
    - main
    - develop

deploy:staging:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context staging
    - kubectl set image deployment/ml-platform ml-platform=$IMAGE_TAG -n ml-platform
    - kubectl rollout status deployment/ml-platform -n ml-platform
  only:
    - develop
  environment:
    name: staging
    url: https://ml-platform-staging.example.com

deploy:production:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context production
    - kubectl set image deployment/ml-platform ml-platform=$IMAGE_TAG -n ml-platform
    - kubectl rollout status deployment/ml-platform -n ml-platform
  only:
    - main
  environment:
    name: production
    url: https://ml-platform.example.com
  when: manual
```

---

**Support**: deployment-support@mlplatform.example.com
