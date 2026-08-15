pipeline {
  agent any

  options {
    timeout(time: 30, unit: 'MINUTES')
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30', artifactNumToKeepStr: '10'))
  }

  environment {
    IMAGE_NAME = 'registry.gunxtech.com/gunxtech/ufin-omnichat-backoffice'
  }

  stages {

    stage('Validate Context') {
      steps {
        script {
          def allowedBranches = ['development', 'production']
          if (!allowedBranches.contains(env.BRANCH_NAME)) {
            error("Unsupported branch '${env.BRANCH_NAME}'. Allowed branches: ${allowedBranches.join(', ')}")
          }

          if (env.BRANCH_NAME == 'development') {
            env.IMAGE_ENV = 'development'
            env.IMAGE_CLIENT_TAG = "client-development-${env.BUILD_NUMBER}"
            env.IMAGE_SERVER_TAG = "server-development-${env.BUILD_NUMBER}"
          } else {
            env.IMAGE_ENV = 'production'
            env.IMAGE_CLIENT_TAG = "client-production-${env.BUILD_NUMBER}"
            env.IMAGE_SERVER_TAG = "server-production-${env.BUILD_NUMBER}"
          }

          echo """
Pipeline Context:
- Job: ${env.JOB_NAME}
- Build: #${env.BUILD_NUMBER}
- Branch: ${env.BRANCH_NAME}
- Environment: ${env.IMAGE_ENV}
- Client Tag: ${env.IMAGE_CLIENT_TAG}
- Server Tag: ${env.IMAGE_SERVER_TAG}
"""
        }
      }
    }

    stage('Checkout Source') {
      steps {
        cleanWs()
        checkout scm
        script {
          env.GIT_COMMIT_SHORT = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
          echo "Checked out commit: ${env.GIT_COMMIT_SHORT}"
        }
      }
    }

    stage('Login Docker Registry') {
      steps {
        script {
          withCredentials([usernamePassword(credentialsId: 'registry.gunxtech', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
            sh label: 'Docker registry login', script: '''echo "$DOCKER_PASS" | docker login registry.gunxtech.com -u "$DOCKER_USER" --password-stdin'''
          }
        }
      }
    }

    stage('Build Docker Images') {
      failFast true
      parallel {
        stage('Build Client') {
          steps {
            script {
              def buildStart = System.currentTimeMillis()
              try {
                sh label: 'Build client image', script: "cd src/web && docker build -t $IMAGE_NAME:$IMAGE_CLIENT_TAG --build-arg ENVIRONMENT=${IMAGE_ENV} --no-cache ."
              } finally {
                def elapsed = ((System.currentTimeMillis() - buildStart) / 1000) as int
                echo "Build Client duration: ${elapsed}s"
              }
            }
          }
        }
        stage('Build Server') {
          steps {
            script {
              def buildStart = System.currentTimeMillis()
              try {
                sh label: 'Build server image', script: "cd src/api && docker build -t $IMAGE_NAME:$IMAGE_SERVER_TAG --build-arg ENVIRONMENT=${IMAGE_ENV} --no-cache ."
              } finally {
                def elapsed = ((System.currentTimeMillis() - buildStart) / 1000) as int
                echo "Build Server duration: ${elapsed}s"
              }
            }
          }
        }
      }
    }

    stage('Push Docker Images') {
      steps {
        script {
          sh label: 'Push client image', script: "docker push $IMAGE_NAME:$IMAGE_CLIENT_TAG"
          sh label: 'Push server image', script: "docker push $IMAGE_NAME:$IMAGE_SERVER_TAG"
        }
      }
    }

    stage('Deploy to Kubernetes') {
      failFast true
      parallel {
        stage('Deploy Client') {
          steps {
            script {
              def kubeconfigId = 'kubedevelopment.gunxtech'
              def deploymentFile = 'deployments/development-client.yaml'

              if (env.BRANCH_NAME == 'production') {
                kubeconfigId = 'kubeproduction.gunxtech'
                deploymentFile = 'deployments/production-client.yaml'
              }

              withCredentials([file(credentialsId: kubeconfigId, variable: 'KUBECONFIG_FILE')]) {
                sh label: 'Deploy client to kubernetes', script: """
                  set -e
                  export KUBECONFIG=\$KUBECONFIG_FILE
                  echo "[CLIENT] Environment: ${env.BRANCH_NAME}"
                  echo "[CLIENT] Applying manifest: ${deploymentFile}"
                  docker manifest inspect $IMAGE_NAME:$IMAGE_CLIENT_TAG > /dev/null

                  kubectl apply -f ${deploymentFile} --validate=false
                  echo "[CLIENT] Updating image: $IMAGE_NAME:$IMAGE_CLIENT_TAG"
                  kubectl set image deployment/gunxtech-ufin-omnichat-backoffice-client-deployment gunxtech-ufin-omnichat-backoffice-client=$IMAGE_NAME:$IMAGE_CLIENT_TAG
                  echo "[CLIENT] Waiting for rollout"
                  kubectl rollout status deployment/gunxtech-ufin-omnichat-backoffice-client-deployment --timeout=600s
                  kubectl describe deployment gunxtech-ufin-omnichat-backoffice-client-deployment
                """
              }
            }
          }
        }

        stage('Deploy Server') {
          steps {
            script {
              def kubeconfigId = 'kubedevelopment.gunxtech'
              def deploymentFile = 'deployments/development-server.yaml'

              if (env.BRANCH_NAME == 'production') {
                kubeconfigId = 'kubeproduction.gunxtech'
                deploymentFile = 'deployments/production-server.yaml'
              }

              withCredentials([file(credentialsId: kubeconfigId, variable: 'KUBECONFIG_FILE')]) {
                sh label: 'Deploy server to kubernetes', script: """
                  set -e
                  export KUBECONFIG=\$KUBECONFIG_FILE
                  echo "[SERVER] Environment: ${env.BRANCH_NAME}"
                  echo "[SERVER] Applying manifest: ${deploymentFile}"
                  docker manifest inspect $IMAGE_NAME:$IMAGE_SERVER_TAG > /dev/null

                  kubectl apply -f ${deploymentFile}
                  echo "[SERVER] Updating image: $IMAGE_NAME:$IMAGE_SERVER_TAG"
                  kubectl set image deployment/gunxtech-ufin-omnichat-backoffice-server-deployment gunxtech-ufin-omnichat-backoffice-server=$IMAGE_NAME:$IMAGE_SERVER_TAG
                  echo "[SERVER] Waiting for rollout"
                  kubectl rollout status deployment/gunxtech-ufin-omnichat-backoffice-server-deployment --timeout=600s
                  kubectl describe deployment gunxtech-ufin-omnichat-backoffice-server-deployment
                """
              }
            }
          }
        }
      }
    }

    stage('Cleanup Docker Images') {
      steps {
        echo 'Cleaning up local Docker images'
        sh label: 'Remove client image', script: "docker rmi $IMAGE_NAME:$IMAGE_CLIENT_TAG || true"
        sh label: 'Remove server image', script: "docker rmi $IMAGE_NAME:$IMAGE_SERVER_TAG || true"
      }
    }

  }

  post {
    success {
      echo 'Build completed successfully'
    }
    failure {
      echo 'Build failed'
    }
  }
}
