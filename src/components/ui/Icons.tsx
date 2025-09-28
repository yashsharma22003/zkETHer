import React from 'react';
import { Text } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
}

export const ShieldIcon: React.FC<IconProps> = ({ size = 16, color = '#ffffff' }) => {
  return (
    <Text style={{ fontSize: size, color }}>🛡️</Text>
  );
};

export const SettingsIcon: React.FC<IconProps> = ({ size = 16, color = '#ffffff' }) => {
  return (
    <Text style={{ fontSize: size, color }}>⚙️</Text>
  );
};

export const SettingsGearIcon: React.FC<IconProps> = ({ size = 16, color = '#ffffff' }) => {
  return (
    <Text style={{ fontSize: size, color }}>⚙️</Text>
  );
};

export const AlertTriangleIcon: React.FC<IconProps> = ({ size = 16, color = '#ffffff' }) => {
  return (
    <Text style={{ fontSize: size, color }}>⚠️</Text>
  );
};

export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 16, color = '#ffffff' }) => {
  return (
    <Text style={{ fontSize: size, color }}>←</Text>
  );
};

export const UserIcon: React.FC<IconProps> = ({ size = 16, color = '#ffffff' }) => {
  return (
    <Text style={{ fontSize: size, color }}>👤</Text>
  );
};

export const FileTextIcon: React.FC<IconProps> = ({ size = 16, color = '#ffffff' }) => {
  return (
    <Text style={{ fontSize: size, color }}>📄</Text>
  );
};

export const LockIcon: React.FC<IconProps> = ({ size = 16, color = '#ffffff' }) => {
  return (
    <Text style={{ fontSize: size, color }}>🔒</Text>
  );
};

export const DownloadIcon: React.FC<IconProps> = ({ size = 16, color = '#ffffff' }) => {
  return (
    <Text style={{ fontSize: size, color }}>⬇️</Text>
  );
};

export const HelpCircleIcon: React.FC<IconProps> = ({ size = 16, color = '#ffffff' }) => {
  return (
    <Text style={{ fontSize: size, color }}>❓</Text>
  );
};
