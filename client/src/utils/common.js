import moment from 'moment';

const formatTime = timestamp => {
  return moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

export { formatTime }
