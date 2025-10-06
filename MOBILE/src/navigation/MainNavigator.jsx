import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import SyllabusScreen from '../screens/SyllabusScreen';
import RoadmapScreen from '../screens/RoadmapScreen';
import FlashcardsScreen from '../screens/FlashcardsScreen';
import MockTestsScreen from '../screens/MockTestsScreen';
import FocusModeScreen from '../screens/FocusModeScreen';

const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Syllabus"
        component={SyllabusScreen}
        options={{
          tabBarLabel: 'Syllabus',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📚</Text>,
        }}
      />
      <Tab.Screen
        name="Roadmap"
        component={RoadmapScreen}
        options={{
          tabBarLabel: 'Roadmap',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🗺️</Text>,
        }}
      />
      <Tab.Screen
        name="Flashcards"
        component={FlashcardsScreen}
        options={{
          tabBarLabel: 'Cards',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🎴</Text>,
        }}
      />
      <Tab.Screen
        name="MockTests"
        component={MockTestsScreen}
        options={{
          tabBarLabel: 'Tests',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📝</Text>,
        }}
      />
      <Tab.Screen
        name="FocusMode"
        component={FocusModeScreen}
        options={{
          tabBarLabel: 'Focus',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🎯</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
