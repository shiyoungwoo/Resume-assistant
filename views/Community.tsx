import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Award, Plus } from 'lucide-react';
import { CommunityPost } from '../types';

interface CommunityProps {
  onAddPoints: (points: number) => void;
}

const mockPosts: CommunityPost[] = [
  {
    id: '1',
    author: 'Sarah Chen',
    avatar: 'https://picsum.photos/id/64/100/100',
    title: 'Just cracked the Google Frontend Interview! Here are my tips.',
    content: 'The system design round was intense. They asked about building a real-time collaborative editor. Make sure you brush up on Operational Transformation vs CRDTs! Also, the behavioral round focused heavily on "handling conflict".',
    likes: 342,
    tags: ['Google', 'Frontend', 'L4'],
    date: '2 hours ago'
  },
  {
    id: '2',
    author: 'David Miller',
    avatar: 'https://picsum.photos/id/103/100/100',
    title: 'Amazon Leadership Principles - My Cheat Sheet',
    content: 'I created a matrix mapping my past projects to each of the 16 LPs. It saved me during the loop. Customer Obsession is still king there. Don\'t fake it.',
    likes: 128,
    tags: ['Amazon', 'SDE II', 'Behavioral'],
    date: '5 hours ago'
  },
  {
    id: '3',
    author: 'Emily Zhang',
    avatar: 'https://picsum.photos/id/65/100/100',
    title: 'Failed my Meta interview, but learned a lot.',
    content: 'Coding rounds were standard LeetCode mediums, but I stumbled on the "Cultural Fit". I was too focused on individual contribution rather than team impact. Next time!',
    likes: 89,
    tags: ['Meta', 'Product Management', 'Experience'],
    date: '1 day ago'
  }
];

const Community: React.FC<CommunityProps> = ({ onAddPoints }) => {
  const [posts, setPosts] = useState<CommunityPost[]>(mockPosts);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = () => {
    if (!newPostContent.trim()) return;
    
    setIsPosting(true);
    // Simulate API call
    setTimeout(() => {
        const newPost: CommunityPost = {
            id: Date.now().toString(),
            author: 'You',
            avatar: 'https://picsum.photos/id/237/100/100',
            title: 'My Interview Journey Update',
            content: newPostContent,
            likes: 0,
            tags: ['General', 'Discussion'],
            date: 'Just now'
        };
        setPosts([newPost, ...posts]);
        setNewPostContent('');
        setIsPosting(false);
        onAddPoints(50); // Reward for posting
        alert("Post shared! You earned 50 points.");
    }, 600);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Feed Section */}
      <div className="flex-1">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Community</h2>
            <p className="text-gray-500 mt-1">Share wisdom, earn points, help others succeed.</p>
          </div>
        </div>

        {/* Create Post */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8">
            <textarea
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                placeholder="Share your interview experience or ask a question..."
                rows={3}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
            />
            <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Award size={16} className="text-yellow-500" />
                    <span>Post to earn <strong>50 pts</strong></span>
                </div>
                <button 
                    onClick={handlePost}
                    disabled={!newPostContent.trim() || isPosting}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isPosting ? 'Posting...' : <><Plus size={18} /> Post</>}
                </button>
            </div>
        </div>

        {/* Posts List */}
        <div className="space-y-6">
            {posts.map(post => (
                <div key={post.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
                    <div className="flex items-start gap-4 mb-4">
                        <img src={post.avatar} alt={post.author} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg">{post.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <span className="font-medium text-gray-900">{post.author}</span>
                                <span>•</span>
                                <span>{post.date}</span>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed mb-4">{post.content}</p>
                    
                    <div className="flex items-center gap-2 mb-4">
                        {post.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                                #{tag}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center gap-6 border-t border-gray-50 pt-4">
                        <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors group">
                            <Heart size={20} className="group-hover:fill-red-500" />
                            <span>{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
                            <MessageCircle size={20} />
                            <span>Comment</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors ml-auto">
                            <Share2 size={20} />
                            <span>Share</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Sidebar Section */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="font-bold text-xl mb-2">Weekly Leaderboard</h3>
            <p className="text-indigo-200 text-sm mb-4">Top contributors this week</p>
            <div className="space-y-4">
                {[1, 2, 3].map((rank) => (
                    <div key={rank} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold">
                            {rank}
                        </div>
                        <div className="flex-1">
                            <p className="font-medium">User {rank * 432}</p>
                            <p className="text-xs text-indigo-300">{1000 - rank * 50} pts</p>
                        </div>
                        {rank === 1 && <Award className="text-yellow-400" />}
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Trending Topics</h3>
            <div className="flex flex-wrap gap-2">
                {['System Design', 'Behavioral', 'Amazon LP', 'Negotiation', 'Remote Work', 'Resume Tips'].map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Community;