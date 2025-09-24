import { useState } from 'react';
import { motion } from 'framer-motion';
import Anna3DAvatar from './Anna3DAvatar';

interface AnnaAvatarProps {
  className?: string;
}

const AnnaAvatar = ({ className = '' }: AnnaAvatarProps) => {
  const [isHovered, setIsHovered] = useState(false);


  return (
    <motion.div
      className={`relative cursor-pointer ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Anna3DAvatar />
      <motion.div
        className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
        transition={{ duration: 0.2 }}
      >
        <p className="text-sm font-medium text-[#2A15EB]">Anna IA</p>
      </motion.div>
    </motion.div>
  );
};

export default AnnaAvatar;