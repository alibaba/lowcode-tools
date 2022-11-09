import * as ip from 'ip';

const getIp = () => {
  return ip.address('private');
}

export { getIp };