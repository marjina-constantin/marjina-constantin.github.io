import React, {useState, useEffect} from 'react';
import {Calendar, momentLocalizer} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {useAuthState, useData} from '../context';
import Modal from "./Modal";

const localizer = momentLocalizer(moment);

const ExpenseCalendar = () => {
  const { data } = useData();
  const items = data.filtered_raw || data.raw;
  const { currency } = useAuthState();

  const [events, setEvents] = useState([]);
  const [calendarHeight, setCalendarHeight] = useState('500px');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const groupByDate = (transactions) => {
    const groupedTransactions = (transactions ?? []).reduce((acc, transaction) => {
      const { type, dt: date, sum } = transaction;
      if (type === 'transaction') {
        const parsedSum = parseFloat(sum);
        if (!acc[date]) {
          acc[date] = parsedSum;
        } else {
          acc[date] += parsedSum;
        }
      }
      return acc;
    }, {});

    return Object.keys(groupedTransactions).map((date) => ({
      date,
      sum: groupedTransactions[date],
    }));
  };

  useEffect(() => {
    // Process expense data to format it for the calendar
    const formattedEvents = (groupByDate(items) ?? []).map((expense) => ({
      id: expense.date,
      title: `${expense.sum} ${currency}`,
      start: new Date(expense.date),
      end: new Date(expense.date),
    }));
    setEvents(formattedEvents);
  }, [items]);

  // Adjust calendar height for mobile devices
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCalendarHeight('300px'); // Set a smaller height for mobile devices
      } else {
        setCalendarHeight('500px'); // Set the default height for larger screens
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEventSelect = (event) => {
    if (window.innerWidth < 768) {
      const date = new Date(event?.start);

      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      setSelectedEvent({
        title: event?.title,
        date: formattedDate
      });
      setShowModal(true);
    }
  };
  return (
    <>
      <div style={{ height: calendarHeight, backgroundColor: '#2c3e50', color: '#fff' }}>
        <Calendar
          localizer={localizer}
          events={events}
          titleAccessor="title"
          views={['month']}
          onSelectEvent={handleEventSelect}
        />
      </div>
      <Modal show={showModal} onClose={(e) => {e.preventDefault(); setShowModal(false); setSelectedEvent(null)}}>
        <h2>{selectedEvent?.date}</h2>
        <p>{selectedEvent?.title}</p>
      </Modal>
    </>

  );
};

export default ExpenseCalendar;
