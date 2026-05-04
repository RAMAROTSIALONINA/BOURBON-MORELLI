import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import {
  Award,
  Users,
  Heart,
  Target,
  ChevronRight,
  Star,
  Shield,
  Gift,
  Sparkles
} from 'lucide-react';
import aboutService from '../services/aboutService';

const ICON_MAP = { Award, Users, Heart, Target, Star, Shield, Gift, Sparkles };

const BACKEND_URL = 'http://localhost:5003';
const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/')) return `${BACKEND_URL}${url}`;
  return `${BACKEND_URL}/${url}`;
};

// Contenu par défaut si l'API est indisponible (fallback identique à l'ancien hardcodé)
const DEFAULT_ABOUT = {
  hero: {
    title: 'Notre Histoire',
    subtitle: "L'élégance malgache rencontre le savoir-faire artisanal"
  },
  story: {
    title: "L'Essence de BOURBON MORELLI",
    paragraphs: [
      "Bourbon Morelli est une société de couture basée à Antananarivo (101 By Pass), Madagascar, créée en 2025. Spécialisée dans la confection de haute qualité, elle propose une large gamme de produits tels que des nappes de table, T-shirts, polos, pantalons et costumes.",
      "Forte de son savoir-faire, Bourbon Morelli s'inscrit dans une démarche de qualité et d'élégance, en valorisant un style unique inspiré de son histoire et de son environnement.",
      "Nous croyons que la véritable luxe réside dans la qualité des matériaux, la précision des détails et l'unicité de chaque création."
    ],
    image_caption: 'Atelier de création - Antananarivo'
  },
  values: [
    { icon: 'Award', title: 'Excellence', description: "Un engagement inébranlable envers la qualité et la perfection artisanale" },
    { icon: 'Heart', title: 'Passion', description: "L'amour du métier et la créativité au cœur de chaque collection" },
    { icon: 'Users', title: 'Authenticité', description: "Des créations uniques qui reflètent la personnalité de chacun" },
    { icon: 'Target', title: 'Innovation', description: "Allier tradition et modernité pour repousser les limites de la création" }
  ],
  milestones: [],
  team: [],
  testimonials: [],
  cta: {
    title: "Rejoignez l'Aventure BOURBON MORELLI",
    subtitle: "Découvrez nos créations uniques et laissez-vous séduire par l'élégance intemporelle de la couture française."
  }
};

const About = () => {
  const [content, setContent] = useState(DEFAULT_ABOUT);

  useEffect(() => {
    let alive = true;
    aboutService
      .getAbout()
      .then((data) => {
        if (!alive || !data) return;
        setContent({
          hero: { ...DEFAULT_ABOUT.hero, ...(data.hero || {}) },
          story: {
            ...DEFAULT_ABOUT.story,
            ...(data.story || {}),
            paragraphs: Array.isArray(data.story?.paragraphs)
              ? data.story.paragraphs
              : DEFAULT_ABOUT.story.paragraphs
          },
          values: Array.isArray(data.values) ? data.values : DEFAULT_ABOUT.values,
          milestones: Array.isArray(data.milestones) ? data.milestones : [],
          team: Array.isArray(data.team) ? data.team : [],
          testimonials: Array.isArray(data.testimonials) ? data.testimonials : [],
          cta: { ...DEFAULT_ABOUT.cta, ...(data.cta || {}) }
        });
      })
      .catch(() => {
        // Fallback silencieux
      });
    return () => {
      alive = false;
    };
  }, []);

  const { hero, story, values, milestones, team, testimonials, cta } = content;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-luxury font-bold mb-6">{hero.title}</h1>
          <p className="text-xl md:text-2xl text-neutral-200 max-w-3xl mx-auto">{hero.subtitle}</p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-luxury font-bold text-neutral-900 mb-6">{story.title}</h2>
              <div className="space-y-4 text-lg text-neutral-600 leading-relaxed">
                {story.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
            <div className="relative h-96 bg-neutral-100 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-neutral-900/20"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <Logo size="full" className="mb-6" />
                <span className="text-neutral-400 text-lg font-medium">{story.image_caption}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      {values.length > 0 && (
        <section className="py-20 bg-neutral-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-luxury font-bold text-neutral-900 mb-4">Nos Valeurs</h2>
              <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
                Les principes qui guident chaque création et chaque décision
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((v, idx) => {
                const Icon = ICON_MAP[v.icon] || Star;
                return (
                  <div key={idx} className="text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8 text-primary-500" />
                    </div>
                    <h3 className="text-xl font-luxury font-semibold mb-2">{v.title}</h3>
                    <p className="text-neutral-600">{v.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Parcours */}
      {milestones.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-luxury font-bold text-neutral-900 mb-4">Notre Parcours</h2>
              <p className="text-xl text-neutral-600">Les moments clés qui ont marqué notre histoire</p>
            </div>
            <div className="max-w-4xl mx-auto">
              {milestones.map((m, idx) => (
                <div key={idx} className="flex items-center mb-12 last:mb-0">
                  <div className="flex-shrink-0 w-24 text-right">
                    <span className="text-2xl font-bold text-primary-500">{m.year}</span>
                  </div>
                  <div className="flex-shrink-0 w-4 h-4 bg-primary-500 rounded-full mx-6"></div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-luxury font-semibold mb-2">{m.title}</h3>
                    <p className="text-neutral-600">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Équipe */}
      {team.length > 0 && (
        <section className="py-20 bg-neutral-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-luxury font-bold text-neutral-900 mb-4">Les Fondateurs</h2>
              <p className="text-xl text-neutral-600">Les visionnaires derrière BOURBON MORELLI</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {team.map((m, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-sm p-8 text-center">
                  {m.photo ? (
                    <img 
                      src={resolveImageUrl(m.photo)}
                      alt={m.name}
                      className="w-32 h-32 object-cover rounded-full mx-auto mb-6"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-neutral-200 rounded-full mx-auto mb-6"></div>
                  )}
                  <h3 className="text-2xl font-luxury font-semibold mb-2">{m.name}</h3>
                  <p className="text-primary-500 font-medium mb-4">{m.role}</p>
                  <p className="text-neutral-600">{m.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-primary-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-luxury font-bold text-white mb-6">{cta.title}</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">{cta.subtitle}</p>
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

      {/* Témoignages */}
      {testimonials.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-luxury font-bold text-neutral-900 mb-4">
                Ce Que Nos Clients Disent
              </h2>
              <div className="flex justify-center items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-gray-600 fill-current" />
                ))}
              </div>
              <p className="text-xl text-neutral-600">Excellence reconnue par nos clients</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((t, idx) => (
                <div key={idx} className="bg-neutral-50 p-6 rounded-lg">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-gray-600 fill-current" />
                    ))}
                  </div>
                  <p className="text-neutral-600 mb-4 italic">"{t.quote}"</p>
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-neutral-500">{t.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default About;
