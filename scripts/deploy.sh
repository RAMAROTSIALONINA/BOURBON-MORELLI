#!/bin/bash

# Script de déploiement pour BOURBON MORELLI
# Usage: ./scripts/deploy.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-development}
PROJECT_NAME="bourbon-morelli"
BACKUP_DIR="/var/backups/$PROJECT_NAME"
LOG_FILE="/var/log/deploy-$PROJECT_NAME.log"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonctions de log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a $LOG_FILE
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a $LOG_FILE
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
}

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    # Vérifier Node.js (pour le développement local)
    if [ "$ENVIRONMENT" = "development" ] && ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        exit 1
    fi
    
    log_info "Prérequis vérifiés avec succès"
}

# Sauvegarde des données
backup_data() {
    log_info "Sauvegarde des données existantes..."
    
    mkdir -p $BACKUP_DIR
    
    # Sauvegarde de la base de données
    if docker-compose ps mysql | grep -q "Up"; then
        log_info "Sauvegarde de la base de données..."
        docker-compose exec mysql mysqldump -u root -p$DB_ROOT_PASSWORD bourbon_morelli > $BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql
        gzip $BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql
    fi
    
    # Sauvegarde des uploads
    if [ -d "server/uploads" ]; then
        log_info "Sauvegarde des fichiers uploads..."
        tar -czf $BACKUP_DIR/uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz server/uploads/
    fi
    
    log_info "Sauvegarde terminée"
}

# Déploiement avec Docker
deploy_docker() {
    log_info "Déploiement avec Docker Compose..."
    
    # Arrêter les services existants
    docker-compose down
    
    # Mettre à jour les images
    docker-compose pull
    
    # Construire les images locales
    docker-compose build
    
    # Démarrer les services
    docker-compose up -d
    
    # Attendre que les services soient prêts
    log_info "Attente du démarrage des services..."
    sleep 30
    
    # Vérifier l'état des services
    if docker-compose ps | grep -q "Up"; then
        log_info "Services démarrés avec succès"
    else
        log_error "Échec du démarrage des services"
        docker-compose logs
        exit 1
    fi
}

# Déploiement en développement local
deploy_development() {
    log_info "Déploiement en environnement de développement..."
    
    # Installation des dépendances
    log_info "Installation des dépendances..."
    npm run install-all
    
    # Démarrage des services
    log_info "Démarrage des services de développement..."
    npm run dev &
    
    # Attendre que les services soient prêts
    sleep 10
    
    log_info "Services de développement démarrés"
    log_info "Frontend: http://localhost:3000"
    log_info "Backend: http://localhost:5000"
}

# Tests de déploiement
run_tests() {
    log_info "Exécution des tests de déploiement..."
    
    # Test de santé du backend
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        log_info "Backend: OK"
    else
        log_error "Backend: Échec du test de santé"
    fi
    
    # Test du frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_info "Frontend: OK"
    else
        log_error "Frontend: Échec du test"
    fi
    
    # Test de la base de données
    if docker-compose exec mysql mysql -u root -p$DB_ROOT_PASSWORD -e "SELECT 1" bourbon_morelli > /dev/null 2>&1; then
        log_info "Base de données: OK"
    else
        log_error "Base de données: Échec du test"
    fi
}

# Nettoyage
cleanup() {
    log_info "Nettoyage des anciennes images et conteneurs..."
    
    # Supprimer les images non utilisées
    docker image prune -f
    
    # Supprimer les conteneurs arrêtés
    docker container prune -f
    
    log_info "Nettoyage terminé"
}

# Affichage des informations de déploiement
show_deployment_info() {
    log_info "Déploiement terminé avec succès!"
    log_info "================================"
    log_info "Environnement: $ENVIRONMENT"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "URL: https://bourbonmorelli.com"
        log_info "API: https://bourbonmorelli.com/api"
    else
        log_info "Frontend: http://localhost:3000"
        log_info "Backend: http://localhost:5000"
        log_info "API: http://localhost:5000/api"
    fi
    
    log_info "================================"
    log_info "Logs: docker-compose logs -f"
    log_info "Arrêt: docker-compose down"
}

# Fonction principale
main() {
    log_info "Début du déploiement de $PROJECT_NAME en environnement $ENVIRONMENT"
    
    # Créer le répertoire de logs
    mkdir -p $(dirname $LOG_FILE)
    
    # Charger les variables d'environnement
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    case $ENVIRONMENT in
        "production"|"staging")
            check_prerequisites
            backup_data
            deploy_docker
            run_tests
            cleanup
            ;;
        "development")
            check_prerequisites
            deploy_development
            ;;
        *)
            log_error "Environnement non reconnu: $ENVIRONMENT"
            log_info "Environnements supportés: development, staging, production"
            exit 1
            ;;
    esac
    
    show_deployment_info
    log_info "Déploiement terminé!"
}

# Gestion des erreurs
trap 'log_error "Une erreur est survenue pendant le déploiement"; exit 1' ERR

# Exécution
main "$@"
