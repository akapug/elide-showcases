# Ruby Capistrano Deployment + TypeScript

module Capistrano
  class Deployer
    def initialize
      @deployments = []
      @servers = {}
    end

    def add_server(name, host)
      @servers[name] = { 'name' => name, 'host' => host, 'status' => 'idle' }
    end

    def deploy(environment, version)
      deployment = {
        'id' => SecureRandom.uuid,
        'environment' => environment,
        'version' => version,
        'status' => 'deploying',
        'started_at' => Time.now.iso8601
      }

      @deployments.push(deployment)

      # Simulate deployment
      sleep 0.2

      deployment['status'] = 'completed'
      deployment['completed_at'] = Time.now.iso8601

      deployment
    end

    def rollback(deployment_id)
      deployment = @deployments.find { |d| d['id'] == deployment_id }
      return { 'error' => 'Deployment not found' } unless deployment

      {
        'rolled_back' => true,
        'deployment_id' => deployment_id,
        'timestamp' => Time.now.iso8601
      }
    end

    def list_deployments
      @deployments
    end

    def list_servers
      @servers.values
    end
  end
end

$deployer = Capistrano::Deployer.new
$deployer.add_server('web1', 'web1.example.com')
$deployer.add_server('web2', 'web2.example.com')
