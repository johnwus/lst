import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useTopics, useTrendingTopics, useCreateTopic } from '../hooks/useQueries';
import { useToast } from '../hooks/use-toast';
import CreateTopicModal from '../components/CreateTopicModal';

const CATEGORIES = [
  { name: 'All', emoji: '🌐' },
  { name: 'Society', emoji: '🌐' },
  { name: 'Tech', emoji: '🤖' },
  { name: 'Culture', emoji: '🎭' },
  { name: 'Money', emoji: '💸' },
  { name: 'Random', emoji: '🎲' },
];

// Skeleton card for desktop grid
function TopicCardSkeleton() {
  return (
    <div className="bg-[hsl(var(--explore-card))]/90 rounded-2xl overflow-hidden border border-white/5 animate-pulse">
      <div className="h-32 w-full bg-white/5" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-white/10 rounded-full w-3/4" />
        <div className="h-3 bg-white/5 rounded-full w-1/2" />
        <div className="flex gap-3 mt-2">
          <div className="h-3 bg-white/5 rounded-full w-12" />
          <div className="h-3 bg-white/5 rounded-full w-12" />
        </div>
      </div>
    </div>
  );
}

// Skeleton row for mobile list
function TopicRowSkeleton() {
  return (
    <div className="w-full bg-[hsl(var(--explore-card))]/90 rounded-xl p-3 border border-white/5 flex items-center gap-3 animate-pulse">
      <div className="w-14 h-14 rounded-xl bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded-full w-3/4" />
        <div className="h-3 bg-white/5 rounded-full w-1/2" />
        <div className="h-3 bg-white/5 rounded-full w-1/3" />
      </div>
    </div>
  );
}

const CATEGORY_COLORS = {
  Society: 'from-blue-500 to-purple-500',
  Tech: 'from-purple-600 to-pink-500',
  Culture: 'from-orange-500 to-red-500',
  Money: 'from-green-500 to-teal-500',
  Random: 'from-pink-500 to-purple-600',
};

export default function Explore() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showNewTopic, setShowNewTopic] = useState(false);

  // Sync category with URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get('category');
    if (catParam && CATEGORIES.some(c => c.name === catParam)) {
      if (catParam === 'Random') {
        const otherCats = CATEGORIES.filter(c => c.name !== 'All' && c.name !== 'Random');
        const randomCat = otherCats[Math.floor(Math.random() * otherCats.length)];
        setCategory(randomCat.name);
      } else {
        setCategory(catParam);
      }
    }
  }, []);

  const handleCategoryChange = (newCat) => {
    if (newCat === 'Random') {
      const otherCats = CATEGORIES.filter(c => c.name !== 'All' && c.name !== 'Random');
      const randomCat = otherCats[Math.floor(Math.random() * otherCats.length)];
      setCategory(randomCat.name);
      return;
    }
    setCategory(newCat);
  };

  // Build query params
  const params = {};
  if (category && category !== 'All') params.category = category;
  if (search) params.search = search;

  // Use TanStack Query for data fetching
  const { data: topics = [], isLoading } = useTopics(params);
  const { data: trending = [] } = useTrendingTopics();
  const createTopicMutation = useCreateTopic();

  const handleCreateTopic = async (formData) => {
    if (!user) { setLocation('/auth'); return; }
    
    // Check follower requirement (admins bypass)
    if (!user.isAdmin && (user.followersCount || 0) < 1000) {
      throw new Error("You need at least 1,000 followers to create a topic.");
    }

    try {
      const topic = await createTopicMutation.mutateAsync(formData);
      toast({
        title: "Success",
        description: "Topic created successfully!",
        variant: "success"
      });
      setLocation(`/topic/${topic._id}`);
    } catch (err) {
      throw err;
    }
  };

  function timeLeftLabel(topic) {
    if (!topic.expiresAt) return '';
    if (topic.timeLeft) return topic.timeLeft;
    const diff = new Date(topic.expiresAt) - new Date();
    if (diff <= 0) return 'Ended';
    const h = Math.floor(diff / 3600000);
    return `${h}hr left`;
  }

  const searchIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );

  const newTopicBtn = user && (
    <button
      onClick={() => setShowNewTopic(true)}
      className="border border-white/20 text-white text-sm px-4 py-1.5 rounded-full hover:bg-white/5 flex items-center gap-1.5"
    >
      + New Topic
    </button>
  );

  return (
    <Layout
      onCategoryClick={handleCategoryChange}
      activeCategory={category}
      headerProps={{
        icon: searchIcon,
        title: 'Explore Topics',
        rightElement: newTopicBtn,
      }}
    >
      <div className="h-full flex flex-col">

        <div className="px-4 py-5 flex-1 flex flex-col overflow-hidden">
          <div className="space-y-3 flex-shrink-0">
            <div className="bg-[hsl(var(--explore-card))]/90 rounded-full flex items-center gap-2 px-4 py-2.5 border border-[hsla(0,0%,100%,0.08)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 flex-shrink-0">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search topics, categories..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none text-sm"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
              {CATEGORIES.map(c => (
                <button
                  key={c.name}
                  onClick={() => handleCategoryChange(c.name)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 border ${
                    category === c.name 
                      ? 'bg-white/15 text-white border-white/20 shadow-lg shadow-black/20' 
                      : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-base">{c.emoji}</span>
                  <span>{c.name === 'All' ? 'All topics' : c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mt-2 space-y-4 pr-1 no-scrollbar lg:pt-5 pb-24">
            {/* Desktop grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-4">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <TopicCardSkeleton key={i} />)
                : topics.map(topic => (
                  <button
                    key={topic._id}
                    onClick={() => setLocation(`/topic/${topic._id}?from=explore`)}
                    className="bg-[hsl(var(--explore-card))]/90 rounded-2xl overflow-hidden border border-[hsla(0,0%,100%,0.08)] hover:border-[hsla(0,0%,100%,0.18)] text-left transition-colors w-full"
                  >
                    <div className="relative h-32 w-full bg-white/5">
                      {topic.imageUrl ? (
                        <img src={topic.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_COLORS[topic.category] || 'from-purple-500 to-blue-500'} flex items-center justify-center text-4xl`}>
                          {topic.emoji || '🌐'}
                        </div>
                      )}
                      <div className="absolute top-2 right-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-md text-[10px] text-white">
                        {topic.category}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-white font-semibold text-sm leading-snug mb-1">{topic.title}</div>
                      <div className="text-gray-400 text-xs">{topic.category} . {timeLeftLabel(topic)}</div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>👁 {(topic.viewCount || 0).toLocaleString()}</span>
                        <span>👥 {(topic.participantCount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
            {!isLoading && topics.length === 0 && (
              <div className="hidden md:flex flex-col items-center justify-center py-16 text-center col-span-3">
                <div className="text-4xl mb-3">💭</div>
                <p className="text-white font-semibold mb-1">No topics in {category === 'All' ? 'this feed' : category}</p>
                <p className="text-gray-500 text-sm mb-4">Check back later or explore another category.</p>
                {category !== 'All' && (
                  <button
                    onClick={() => handleCategoryChange('All')}
                    className="text-purple-400 text-sm hover:text-purple-300 border border-purple-500/20 rounded-full px-4 py-1.5 hover:border-purple-500/40 transition-colors"
                  >
                    Browse all topics
                  </button>
                )}
              </div>
            )}

            {/* Mobile list */}
            <div className="grid grid-cols-1 gap-2 md:hidden">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <TopicRowSkeleton key={i} />)
                : topics.map(topic => (
                <button
                  key={topic._id}
                  onClick={() => setLocation(`/topic/${topic._id}`)}
                  className="w-full bg-[hsl(var(--explore-card))]/90 rounded-xl p-3 border border-[hsla(0,0%,100%,0.08)] hover:border-[hsla(0,0%,100%,0.18)] text-left flex items-center gap-3 transition-colors"
                >
                  <div className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0`}>
                    {topic.imageUrl ? (
                      <img src={topic.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_COLORS[topic.category] || 'from-purple-500 to-blue-500'} flex items-center justify-center text-2xl`}>
                        {topic.emoji || '🌐'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm leading-snug mb-0.5 truncate">{topic.title}</div>
                    <div className="text-gray-400 text-xs">{topic.category} . {timeLeftLabel(topic)}</div>
                    <div className="text-gray-400 text-xs">{(topic.participantCount || 0).toLocaleString()} participating</div>
                  </div>
                </button>
              ))}

              {!isLoading && topics.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="text-4xl mb-3">💭</div>
                  <p className="text-white font-semibold mb-1">No topics in {category === 'All' ? 'this feed' : category}</p>
                  <p className="text-gray-500 text-sm mb-4">Check back later or explore another category.</p>
                  {category !== 'All' && (
                    <button
                      onClick={() => handleCategoryChange('All')}
                      className="text-purple-400 text-sm hover:text-purple-300 border border-purple-500/20 rounded-full px-4 py-1.5 hover:border-purple-500/40 transition-colors"
                    >
                      Browse all topics
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateTopicModal 
        isOpen={showNewTopic} 
        onClose={() => setShowNewTopic(false)} 
        onCreate={handleCreateTopic}
        isAdmin={user?.isAdmin}
      />
    </Layout>
  );
}
