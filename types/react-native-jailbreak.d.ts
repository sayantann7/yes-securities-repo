declare module 'react-native-jailbreak' {
  const Jailbreak: {
    isJailBroken(): Promise<boolean>;
  };
  export default Jailbreak;
}
