import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { 
  Award, 
  Users, 
  Heart, 
  Target,
  ChevronRight,
  Star
} from 'lucide-react';

const About = () => {
  const teamMembers = [
    {
      name: 'Sophie Bourbon',
      role: 'Fondatrice & Directrice Créative',
      bio: 'Passionnée de couture depuis son enfance, Sophie a transformé sa passion en une marque de renommée internationale.'
    },
    {
      name: 'Pierre Morelli',
      role: 'Directeur Artistique',
      bio: 'Avec plus de 20 ans d\'expérience dans la mode haut de gamme, Pierre apporte une vision unique à chaque création.'
    }
  ];

  const milestones = [
    {
      year: '2025',
      title: 'Fondation',
      description: 'Création de Bourbon Morelli à Antananarivo, Madagascar'
    },
    {
      year: '2025',
      title: 'Lancement',
      description: 'Première collection de nappes de table et vêtements'
    },
    {
      year: '2025',
      title: 'Digital',
      description: 'Lancement de la plateforme e-commerce'
    },
    {
      year: '2025',
      title: 'Expansion',
      description: 'Développement de nouvelles gammes de produits'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-luxury font-bold mb-6">
            Notre Histoire
          </h1>
          <p className="text-xl md:text-2xl text-neutral-200 max-w-3xl mx-auto">
            L'élégance malgache rencontre le savoir-faire artisanal
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-luxury font-bold text-neutral-900 mb-6">
                L'Essence de BOURBON MORELLI
              </h2>
              <div className="space-y-4 text-lg text-neutral-600 leading-relaxed">
                <p>
                  Bourbon Morelli est une société de couture basée à Antananarivo (101 By Pass), 
                  Madagascar, créée en 2025. Spécialisée dans la confection de haute qualité, 
                  elle propose une large gamme de produits tels que des nappes de table, T-shirts, 
                  polos, pantalons et costumes.
                </p>
                <p>
                  Forte de son savoir-faire, Bourbon Morelli s'inscrit dans une démarche 
                  de qualité et d'élégance, en valorisant un style unique inspiré de son histoire 
                  et de son environnement. Chaque pièce que nous créons est le fruit d'un travail 
                  méticuleux, alliant techniques traditionnelles et innovation contemporaine.
                </p>
                <p>
                  Nous croyons que la véritable luxe réside dans la qualité des matériaux, 
                  la précision des détails et l'unicité de chaque création. Notre engagement 
                  envers l'excellence se reflète dans chaque produit sortant de notre atelier 
                  malgache, où tradition et modernité se rencontrent.
                </p>
              </div>
            </div>
            <div className="relative h-96 bg-neutral-100 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-neutral-900/20"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <Logo size="full" className="mb-6" />
                <span className="text-neutral-400 text-lg font-medium">Atelier de création - Antananarivo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-luxury font-bold text-neutral-900 mb-4">
              Nos Valeurs
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Les principes qui guident chaque création et chaque décision
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-luxury font-semibold mb-2">Excellence</h3>
              <p className="text-neutral-600">
                Un engagement inébranlable envers la qualité et la perfection artisanale
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-luxury font-semibold mb-2">Passion</h3>
              <p className="text-neutral-600">
                L'amour du métier et la créativité au cœur de chaque collection
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-luxury font-semibold mb-2">Authenticité</h3>
              <p className="text-neutral-600">
                Des créations uniques qui reflètent la personnalité de chacun
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-luxury font-semibold mb-2">Innovation</h3>
              <p className="text-neutral-600">
                Allier tradition et modernité pour repousser les limites de la création
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-luxury font-bold text-neutral-900 mb-4">
              Notre Parcours
            </h2>
            <p className="text-xl text-neutral-600">
              Les moments clés qui ont marqué notre histoire
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-center mb-12 last:mb-0">
                <div className="flex-shrink-0 w-24 text-right">
                  <span className="text-2xl font-bold text-primary-500">{milestone.year}</span>
                </div>
                <div className="flex-shrink-0 w-4 h-4 bg-primary-500 rounded-full mx-6"></div>
                <div className="flex-grow">
                  <h3 className="text-xl font-luxury font-semibold mb-2">{milestone.title}</h3>
                  <p className="text-neutral-600">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-luxury font-bold text-neutral-900 mb-4">
              Les Fondateurs
            </h2>
            <p className="text-xl text-neutral-600">
              Les visionnaires derrière BOURBON MORELLI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="w-32 h-32 bg-neutral-200 rounded-full mx-auto mb-6"></div>
                <h3 className="text-2xl font-luxury font-semibold mb-2">{member.name}</h3>
                <p className="text-primary-500 font-medium mb-4">{member.role}</p>
                <p className="text-neutral-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-luxury font-bold text-white mb-6">
            Rejoignez l'Aventure BOURBON MORELLI
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Découvrez nos créations uniques et laissez-vous séduire par l'élégance 
            intemporelle de la couture française.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/collections"
              className="bg-white text-primary-500 px-8 py-3 rounded-lg font-medium hover:bg-neutral-100 transition-colors inline-flex items-center space-x-2"
            >
              <span>Explorer les collections</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-primary-500 transition-colors"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-luxury font-bold text-neutral-900 mb-4">
              Ce Que Nos Clients Disent
            </h2>
            <div className="flex justify-center items-center space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
              ))}
            </div>
            <p className="text-xl text-neutral-600">
              Excellence reconnue par nos clients du monde entier
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-neutral-50 p-6 rounded-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-neutral-600 mb-4 italic">
                "Des créations d'une qualité exceptionnelle. Le service client est à la hauteur 
                de la réputation de la marque."
              </p>
              <div>
                <p className="font-semibold">Marie L.</p>
                <p className="text-sm text-neutral-500">Paris, France</p>
              </div>
            </div>

            <div className="bg-neutral-50 p-6 rounded-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-neutral-600 mb-4 italic">
                "Chaque pièce est une œuvre d'art. Je suis cliente depuis des années et 
                je n'ai jamais été déçue."
              </p>
              <div>
                <p className="font-semibold">James K.</p>
                <p className="text-sm text-neutral-500">New York, USA</p>
              </div>
            </div>

            <div className="bg-neutral-50 p-6 rounded-lg">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-neutral-600 mb-4 italic">
                "L'élégance française à son meilleur niveau. Des vêtements qui traversent 
                les tendances et le temps."
              </p>
              <div>
                <p className="font-semibold">Sophie M.</p>
                <p className="text-sm text-neutral-500">Londres, UK</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
