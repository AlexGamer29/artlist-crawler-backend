pipeline {
    agent any
    environment {
        GIT_URL = 'https://github.com/AlexGamer29/artlist-crawler-backend'
        GIT_BRANCH = 'master'
        COMPOSE_FILE = 'docker-compose.yml'
        // Load all environment variables from single credential
        ARTLIST_ENV = credentials('artlist-env')
    }
    stages {
        stage('Clone Repository') {
            steps {
                script {
                    // Use GitHub credentials for fetching the repository
                    git credentialsId: 'Gitsun123vet', branch: "${GIT_BRANCH}", url: "${GIT_URL}"
                }
            }
        }
        
        stage('Setup Environment') {
            steps {
                script {
                    // Copy the credential file content to .env file
                    sh '''
                        cp $ARTLIST_ENV .env
                    '''
                }
            }
        }
        
        stage('Stop all services') {
            steps {
                script {
                    sh 'docker-compose down -v'
                }
            }
        }
        
        stage('Build and Run Docker Compose') {
            steps {
                script {
                    sh 'docker-compose up -d --build'
                }
            }
        }
        
        stage('Post Actions') {
            steps {
                script {
                    echo "Build and deployment successful"
                }
            }
        }
    }
    post {
        success {
            echo "Pipeline executed successfully"
            cleanWs()
        }
        failure {
            echo "Pipeline failed"
            cleanWs()
        }
    }
}