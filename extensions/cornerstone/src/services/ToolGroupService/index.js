import ToolGroupService from './ToolGroupService';

export default function ExtendedToolGroupService(serviceManager) {
  return {
    name: 'toolGroupService',
    altName: 'ToolGroupService',
    create: ({ configuration = {} }) => {
      return new ToolGroupService(serviceManager);
    },
  };
}
