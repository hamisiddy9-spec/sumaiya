/**
 * Learning resources display for skill development
 * Shows recommended courses, tutorials, and learning paths
 */

import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { cn } from '@sumaiya/utils';
import type { LearningResource } from './chat-types';

interface LearningResourcesProps {
  resources: LearningResource[];
  onResourcePress?: (resource: LearningResource) => void;
  compact?: boolean;
}

export function LearningResources({
  resources,
  onResourcePress,
  compact = false
}: LearningResourcesProps) {
  if (!resources || resources.length === 0) return null;

  return (
    <View className={cn('mx-4 my-3', compact && 'gap-2')}>
      {/* Header */}
      {!compact && (
        <View className="mb-3 flex-row items-center gap-2">
          <Text className="text-2xl">📚</Text>
          <Text className="text-lg font-bold text-gray-900">Learning Resources</Text>
        </View>
      )}

      {/* Resources List */}
      <View className="gap-2">
        {resources.slice(0, compact ? 3 : resources.length).map(resource => (
          <LearningResourceCard
            key={resource.id}
            resource={resource}
            onPress={() => {
              onResourcePress?.(resource);
              // Open link
              if (resource.url) {
                Linking.openURL(resource.url).catch(err =>
                  console.error('Failed to open URL:', err)
                );
              }
            }}
            compact={compact}
          />
        ))}
      </View>

      {/* Show more button if truncated */}
      {compact && resources.length > 3 && (
        <Pressable className="mt-2 py-2 active:bg-gray-100">
          <Text className="text-center text-sm font-semibold text-indigo-600">
            +{resources.length - 3} more resources
          </Text>
        </Pressable>
      )}
    </View>
  );
}

interface LearningResourceCardProps {
  resource: LearningResource;
  onPress: () => void;
  compact?: boolean;
}

function LearningResourceCard({
  resource,
  onPress,
  compact = false
}: LearningResourceCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformEmoji = (platform: string) => {
    const emojis: Record<string, string> = {
      freecodecamp: '🎓',
      coursera: '📖',
      udemy: '🎯',
      youtube: '📹',
      linkedin: '💼',
      skillshare: '🎨',
      datacamp: '📊',
      pluralsight: '🔧',
      codecademy: '💻',
      edx: '🏫'
    };
    return emojis[platform.toLowerCase()] || '📚';
  };

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-lg px-3 py-3 bg-white border border-gray-200',
        'active:bg-gray-50'
      )}
    >
      <View className={cn(!compact && 'gap-2')}>
        {/* Title and platform */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text
              numberOfLines={compact ? 1 : 2}
              className="font-semibold text-gray-900 text-sm"
            >
              {getPlatformEmoji(resource.platform)} {resource.name}
            </Text>
            <Text className="text-xs text-gray-600 mt-0.5">{resource.platform}</Text>
          </View>
          <View
            className={cn(
              'px-2 py-1 rounded-full',
              getDifficultyColor(resource.difficulty)
            )}
          >
            <Text className="text-xs font-medium capitalize">
              {resource.difficulty}
            </Text>
          </View>
        </View>

        {!compact && resource.description && (
          <Text numberOfLines={2} className="text-xs text-gray-600">
            {resource.description}
          </Text>
        )}

        {/* Metadata: duration and rating */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-gray-600">⏱ {resource.duration}</Text>
            <Text className="text-xs text-gray-600">⭐ {resource.rating.toFixed(1)}</Text>
          </View>
          <Text className="text-xs font-semibold text-indigo-600">Open →</Text>
        </View>
      </View>
    </Pressable>
  );
}
