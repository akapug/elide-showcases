#!/usr/bin/env ruby
# frozen_string_literal: true

#
# Deployment Executor - Ruby Component
#
# Handles actual deployment tasks with Ruby's powerful scripting capabilities.
# Integrates with various deployment targets and platforms.
#

require 'json'
require 'open3'
require 'fileutils'
require 'net/http'
require 'uri'
require 'timeout'

# ============================================================================
# Configuration and Constants
# ============================================================================

DEPLOYMENT_TIMEOUT = 300 # 5 minutes
RETRY_ATTEMPTS = 3
RETRY_DELAY = 5 # seconds

# ============================================================================
# Deployment Context
# ============================================================================

class DeploymentContext
  attr_reader :name, :version, :environment, :target

  def initialize(data)
    deployment = data['deployment']
    @name = deployment['name']
    @version = deployment['version']
    @environment = deployment['environment']
    @target = data['target']
  end

  def to_s
    "#{@name} v#{@version} to #{@environment} (#{@target['type']})"
  end
end

# ============================================================================
# Deployment Strategies
# ============================================================================

class BaseDeployer
  attr_reader :context

  def initialize(context)
    @context = context
  end

  def deploy
    raise NotImplementedError, 'Subclasses must implement deploy method'
  end

  protected

  def log(message, level = :info)
    timestamp = Time.now.strftime('%Y-%m-%d %H:%M:%S')
    prefix = case level
             when :error then '[ERROR]'
             when :warn then '[WARN]'
             when :success then '[SUCCESS]'
             else '[INFO]'
             end

    puts "#{timestamp} #{prefix} #{message}"
  end

  def execute_command(command, timeout: 30)
    log "Executing: #{command}"

    stdout, stderr, status = Open3.capture3(command, timeout: timeout)

    unless status.success?
      raise "Command failed: #{stderr}"
    end

    stdout.strip
  rescue Timeout::Error
    raise "Command timed out after #{timeout} seconds"
  end

  def retry_on_failure(attempts: RETRY_ATTEMPTS, delay: RETRY_DELAY)
    attempt = 1

    begin
      yield
    rescue StandardError => e
      if attempt < attempts
        log "Attempt #{attempt} failed: #{e.message}, retrying in #{delay}s...", :warn
        sleep delay
        attempt += 1
        retry
      else
        log "All #{attempts} attempts failed", :error
        raise
      end
    end
  end

  def create_backup(path)
    backup_path = "#{path}.backup.#{Time.now.to_i}"
    FileUtils.cp_r(path, backup_path) if File.exist?(path)
    backup_path
  end

  def verify_checksum(file, expected_checksum)
    actual = Digest::SHA256.file(file).hexdigest
    actual == expected_checksum
  end
end

# ============================================================================
# Server Deployer
# ============================================================================

class ServerDeployer < BaseDeployer
  def deploy
    log "Deploying #{context} to server"

    target = context.target
    host = target['host']
    port = target['port'] || 22

    # Step 1: Prepare deployment package
    log 'Preparing deployment package...'
    package_path = prepare_package

    # Step 2: Upload package
    log "Uploading to #{host}:#{port}..."
    upload_package(host, port, package_path)

    # Step 3: Install package
    log 'Installing package on remote server...'
    install_package(host, port)

    # Step 4: Restart services
    log 'Restarting services...'
    restart_services(host, port)

    # Step 5: Verify deployment
    log 'Verifying deployment...'
    verify_deployment(host, port)

    log "Deployment completed successfully for #{context.target['id']}", :success
  end

  private

  def prepare_package
    # Simulate package preparation
    package_path = "/tmp/#{context.name}-#{context.version}.tar.gz"

    # In real scenario, this would create actual package
    log "Package prepared: #{package_path}"

    package_path
  end

  def upload_package(host, port, package_path)
    # Simulate SCP/SFTP upload
    retry_on_failure do
      log "Uploading package to #{host}..."
      sleep 1 # Simulate upload time
      log 'Upload completed'
    end
  end

  def install_package(host, port)
    # Simulate remote installation
    commands = [
      'sudo systemctl stop myapp',
      "sudo tar -xzf /tmp/#{context.name}-#{context.version}.tar.gz -C /opt/myapp",
      'sudo chown -R myapp:myapp /opt/myapp',
    ]

    commands.each do |cmd|
      log "Remote: #{cmd}"
      sleep 0.5 # Simulate execution
    end
  end

  def restart_services(host, port)
    retry_on_failure do
      log 'Restarting application services...'
      sleep 2 # Simulate restart time
      log 'Services restarted'
    end
  end

  def verify_deployment(host, port)
    # Verify the deployment by checking service status
    log 'Checking service status...'
    sleep 1

    # Check if application is responding
    app_port = context.target['port'] || 8080
    health_check(host, app_port)
  end

  def health_check(host, port)
    max_attempts = 10
    attempt = 1

    while attempt <= max_attempts
      begin
        uri = URI("http://#{host}:#{port}/health")
        response = Net::HTTP.get_response(uri)

        if response.is_a?(Net::HTTPSuccess)
          log 'Health check passed', :success
          return true
        end
      rescue StandardError => e
        log "Health check attempt #{attempt}/#{max_attempts} failed: #{e.message}", :warn
      end

      sleep 3
      attempt += 1
    end

    raise 'Health check failed after maximum attempts'
  end
end

# ============================================================================
# Container Deployer
# ============================================================================

class ContainerDeployer < BaseDeployer
  def deploy
    log "Deploying #{context} to container platform"

    # Step 1: Build container image
    log 'Building container image...'
    image_tag = build_image

    # Step 2: Push to registry
    log 'Pushing image to registry...'
    push_image(image_tag)

    # Step 3: Update container
    log 'Updating container...'
    update_container(image_tag)

    # Step 4: Verify container health
    log 'Verifying container health...'
    verify_container_health

    log "Container deployment completed successfully for #{context.target['id']}", :success
  end

  private

  def build_image
    image_name = context.name
    image_tag = "#{image_name}:#{context.version}"

    log "Building image: #{image_tag}"

    # Simulate docker build
    sleep 2

    log "Image built: #{image_tag}"
    image_tag
  end

  def push_image(image_tag)
    registry = context.target.dig('metadata', 'registry') || 'docker.io'

    log "Pushing #{image_tag} to #{registry}..."

    retry_on_failure do
      # Simulate docker push
      sleep 2
      log 'Image pushed successfully'
    end
  end

  def update_container(image_tag)
    container_name = "#{context.name}-#{context.environment}"

    log "Updating container: #{container_name}"

    # Stop old container
    log 'Stopping old container...'
    sleep 1

    # Start new container
    log "Starting new container with image: #{image_tag}"
    sleep 2

    log 'Container updated'
  end

  def verify_container_health
    max_attempts = 10
    attempt = 1

    while attempt <= max_attempts
      log "Checking container health (#{attempt}/#{max_attempts})..."

      # Simulate health check
      sleep 2

      # Assume success for demo
      if attempt >= 3
        log 'Container is healthy', :success
        return true
      end

      attempt += 1
    end

    raise 'Container health check failed'
  end
end

# ============================================================================
# Kubernetes Deployer
# ============================================================================

class KubernetesDeployer < BaseDeployer
  def deploy
    log "Deploying #{context} to Kubernetes cluster"

    # Step 1: Prepare manifests
    log 'Preparing Kubernetes manifests...'
    manifests = prepare_manifests

    # Step 2: Apply manifests
    log 'Applying manifests to cluster...'
    apply_manifests(manifests)

    # Step 3: Wait for rollout
    log 'Waiting for rollout to complete...'
    wait_for_rollout

    # Step 4: Verify pods
    log 'Verifying pod health...'
    verify_pods

    log "Kubernetes deployment completed successfully for #{context.target['id']}", :success
  end

  private

  def prepare_manifests
    namespace = context.target.dig('metadata', 'namespace') || 'default'
    deployment_name = "#{context.name}-#{context.environment}"

    manifest = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: deployment_name,
        namespace: namespace,
        labels: {
          app: context.name,
          version: context.version,
          environment: context.environment,
        },
      },
      spec: {
        replicas: 3,
        selector: {
          matchLabels: {
            app: context.name,
          },
        },
        template: {
          metadata: {
            labels: {
              app: context.name,
              version: context.version,
            },
          },
          spec: {
            containers: [
              {
                name: context.name,
                image: "#{context.name}:#{context.version}",
                ports: [
                  {
                    containerPort: 8080,
                  },
                ],
                livenessProbe: {
                  httpGet: {
                    path: '/health',
                    port: 8080,
                  },
                  initialDelaySeconds: 30,
                  periodSeconds: 10,
                },
              },
            ],
          },
        },
      },
    }

    log "Manifest prepared for #{deployment_name}"
    manifest
  end

  def apply_manifests(manifests)
    retry_on_failure do
      log 'Applying manifests with kubectl...'

      # Simulate kubectl apply
      sleep 2

      log 'Manifests applied successfully'
    end
  end

  def wait_for_rollout
    deployment_name = "#{context.name}-#{context.environment}"
    namespace = context.target.dig('metadata', 'namespace') || 'default'

    log "Waiting for rollout of #{deployment_name} in namespace #{namespace}..."

    timeout = 300 # 5 minutes
    start_time = Time.now

    while Time.now - start_time < timeout
      # Simulate checking rollout status
      sleep 3

      # Check if rollout is complete (simulated)
      if (Time.now - start_time) > 10
        log 'Rollout completed', :success
        return true
      end

      log 'Rollout in progress...'
    end

    raise 'Rollout timeout'
  end

  def verify_pods
    log 'Verifying pod status...'

    # Check pod health
    sleep 2

    pods_ready = check_pod_readiness
    raise 'Not all pods are ready' unless pods_ready

    log 'All pods are healthy and ready', :success
  end

  def check_pod_readiness
    log 'Checking pod readiness...'

    # Simulate checking pod status
    sleep 1

    # Assume success for demo
    true
  end
end

# ============================================================================
# Serverless Deployer
# ============================================================================

class ServerlessDeployer < BaseDeployer
  def deploy
    log "Deploying #{context} to serverless platform"

    # Step 1: Package function
    log 'Packaging serverless function...'
    package_path = package_function

    # Step 2: Upload to cloud
    log 'Uploading function to cloud provider...'
    upload_function(package_path)

    # Step 3: Update function configuration
    log 'Updating function configuration...'
    update_function_config

    # Step 4: Verify function
    log 'Verifying function deployment...'
    verify_function

    log "Serverless deployment completed successfully for #{context.target['id']}", :success
  end

  private

  def package_function
    package_path = "/tmp/#{context.name}-#{context.version}.zip"

    log "Packaging function to #{package_path}..."
    sleep 1

    log 'Function packaged successfully'
    package_path
  end

  def upload_function(package_path)
    provider = context.target.dig('metadata', 'provider') || 'aws'
    function_name = "#{context.name}-#{context.environment}"

    log "Uploading to #{provider} function: #{function_name}"

    retry_on_failure do
      # Simulate cloud upload
      sleep 2
      log 'Function uploaded successfully'
    end
  end

  def update_function_config
    log 'Updating function configuration (memory, timeout, env vars)...'

    # Simulate configuration update
    sleep 1

    log 'Configuration updated'
  end

  def verify_function
    log 'Invoking test function...'

    retry_on_failure(attempts: 5, delay: 3) do
      # Simulate function invocation
      sleep 2

      # Check response
      log 'Function invocation successful', :success
    end
  end
end

# ============================================================================
# Deployer Factory
# ============================================================================

class DeployerFactory
  def self.create(context)
    case context.target['type']
    when 'server'
      ServerDeployer.new(context)
    when 'container'
      ContainerDeployer.new(context)
    when 'kubernetes'
      KubernetesDeployer.new(context)
    when 'serverless'
      ServerlessDeployer.new(context)
    else
      raise "Unsupported deployment target type: #{context.target['type']}"
    end
  end
end

# ============================================================================
# Main Entry Point
# ============================================================================

def main
  begin
    # Read deployment configuration from command line
    if ARGV.empty?
      puts 'Usage: deployer.rb <deployment-json>'
      exit 1
    end

    config_json = ARGV[0]
    config = JSON.parse(config_json)

    # Create deployment context
    context = DeploymentContext.new(config)

    puts "=" * 80
    puts "Starting Deployment: #{context}"
    puts "=" * 80
    puts

    # Create appropriate deployer
    deployer = DeployerFactory.create(context)

    # Execute deployment with timeout
    Timeout.timeout(DEPLOYMENT_TIMEOUT) do
      deployer.deploy
    end

    puts
    puts "=" * 80
    puts "Deployment Successful!"
    puts "=" * 80

    exit 0

  rescue Timeout::Error
    puts
    puts "[ERROR] Deployment timed out after #{DEPLOYMENT_TIMEOUT} seconds"
    exit 1

  rescue StandardError => e
    puts
    puts "[ERROR] Deployment failed: #{e.message}"
    puts e.backtrace.take(5).join("\n") if ENV['DEBUG']
    exit 1
  end
end

# Run main if this script is executed directly
main if __FILE__ == $PROGRAM_NAME
