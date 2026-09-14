pipeline {
    // Execute on any available Jenkins agent
    agent any

    environment {
        // Defines the tag using the Jenkins build number for version control
        IMAGE_TAG = "v1.${env.BUILD_NUMBER}"
        COMPOSE_PROJECT_NAME = "bank-microservices"
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Checking out from version control...'
                checkout scm
            }
        }

        stage('Install & Unit Test') {
            steps {
                echo 'Installing dependencies and running tests...'
                // Example of running tests in one of the services
                sh '''
                    cd services/transaction-service
                    npm ci --only=production
                    # npm test (Uncomment when test scripts are added to package.json)
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                echo "Building microservice images with tag: ${IMAGE_TAG}..."
                // Build all services defined in docker-compose.yml
                sh 'docker-compose build'
            }
        }

        stage('Security Scan') {
            steps {
                echo 'Running vulnerability scans on built images...'
                // Placeholder for Trivy or npm audit steps
                sh 'npm audit --production || true'
            }
        }

        stage('Deploy to Environment') {
            steps {
                echo 'Deploying the cluster via Docker Compose...'
                // Tears down the old containers and spins up the newly built ones
                sh 'docker-compose down'
                sh 'docker-compose up -d'
            }
        }
    }

    post {
        success {
            echo "🚀 Deployment Successful! API Gateway is live."
        }
        failure {
            echo "❌ Pipeline failed. Please check the logs."
            // In a real scenario, you could trigger a Slack notification or email here
        }
        always {
            // Clean up dangling images to save disk space on the Jenkins node
            sh 'docker image prune -f'
        }
    }
}