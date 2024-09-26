import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import "./App.css";

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [totalDailyExpense, setTotalDailyExpense] = useState(0);
  const [totalMonthlyExpense, setTotalMonthlyExpense] = useState(0);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    fetchExpenses();
  }, [selectedDate]);

  const fetchExpenses = async () => {
    const response = await axios.get("http://localhost:5000/api/expenses");
    setExpenses(response.data);
    processExpenses(response.data);
  };

  const processExpenses = (data) => {
    processDailyExpenses(data);
    processMonthlyExpenses(data);
  };

  const processDailyExpenses = (data) => {
    const dailyExp = data.filter((exp) =>
      exp.created_at.startsWith(selectedDate)
    );
    setDailyExpenses(dailyExp);

    const total = dailyExp.reduce((sum, exp) => sum + exp.amount, 0);
    setTotalDailyExpense(total);
  };

  const processMonthlyExpenses = (data) => {
    const startDate = startOfMonth(parseISO(selectedDate));
    const endDate = endOfMonth(parseISO(selectedDate));

    const monthExp = data.filter((exp) => {
      const expDate = parseISO(exp.created_at);
      return expDate >= startDate && expDate <= endDate;
    });

    const groupedExpenses = monthExp.reduce((acc, exp) => {
      const day = format(parseISO(exp.created_at), "dd");
      if (!acc[day]) acc[day] = { day, total: 0 };
      acc[day].total += exp.amount;
      return acc;
    }, {});

    const monthlyData = Object.values(groupedExpenses).sort(
      (a, b) => a.day - b.day
    );
    setMonthlyExpenses(monthlyData);

    const total = monthExp.reduce((sum, exp) => sum + exp.amount, 0);
    setTotalMonthlyExpense(total);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`http://localhost:5000/api/expenses/${editingId}`, {
        amount: Number(amount),
        currency,
        comment,
      });
    } else {
      await axios.post("http://localhost:5000/api/expenses", {
        amount: Number(amount),
        currency,
        comment,
        created_at: selectedDate,
      });
    }
    setAmount("");
    setCurrency("");
    setComment("");
    setEditingId(null);
    fetchExpenses();
  };

  const handleEdit = (expense) => {
    setAmount(expense.amount);
    setCurrency(expense.currency);
    setComment(expense.comment);
    setEditingId(expense._id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5000/api/expenses/${id}`);
    fetchExpenses();
  };

  return (
    <div className="container">
      <h1>Expense Tracker</h1>

      <div className="date-selector">
        <label htmlFor="date">Select Date: </label>
        <input
          type="date"
          id="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <div className="charts-container">
        <div className="chart">
          <h2>Daily Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyExpenses}>
              <XAxis dataKey="comment" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
          <div className="expense-summary">
            <h3>
              Total Daily Expense: {totalDailyExpense.toFixed(2)}{" "}
              {dailyExpenses[0]?.currency || ""}
            </h3>
          </div>
        </div>

        <div className="chart">
          <h2>Monthly Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyExpenses}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
          <div className="expense-summary">
            <h3>
              Total Monthly Expense: {totalMonthlyExpense.toFixed(2)}{" "}
              {dailyExpenses[0]?.currency || ""}
            </h3>
          </div>
        </div>
      </div>

      <div className="expense-list">
        <h2>Expenses for {format(parseISO(selectedDate), "MMMM d, yyyy")}</h2>
        {dailyExpenses.length === 0 ? (
          <p>No expenses recorded for this date.</p>
        ) : (
          <ul>
            {dailyExpenses.map((expense) => (
              <li key={expense._id}>
                <div className="expense-item">
                  <p className="expense-comment">{expense.comment}</p>
                  <p className="expense-amount">
                    {expense.amount} {expense.currency}
                  </p>
                </div>
                <div className="expense-details">
                  <p>{format(parseISO(expense.created_at), "h:mm a")}</p>
                  <div className="expense-actions">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense._id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleSubmit} className="expense-form">
        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>
        <div className="form-group">
          <label htmlFor="currency">Currency</label>
          <input
            id="currency"
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            placeholder="Enter currency"
          />
        </div>
        <div className="form-group">
          <label htmlFor="comment">Comment</label>
          <input
            id="comment"
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter comment"
          />
        </div>
        <button type="submit" className="submit-btn">
          {editingId ? "Update" : "Add"} Expense
        </button>
      </form>
    </div>
  );
}

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import "./App.css";
// import { format } from "date-fns";
// import {
//   Tooltip,
//   Legend,
//   Bar,
//   BarChart,
//   XAxis,
//   YAxis,
//   ResponsiveContainer,
//   Line,
//   LineChart,
// } from "recharts";
// export default function App() {
//   //eslint-disable-next-line
//   const [expenses, setExpenses] = useState([]);
//   const [amount, setAmount] = useState("");
//   const [currency, setCurrency] = useState("");
//   const [comment, setComment] = useState("");
//   const [editingId, setEditingId] = useState(null);
//   const [dailyExpenses, setDailyExpenses] = useState([]);
//   const [totalDailyExpense, setTotalDailyExpense] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [expensesPerPage] = useState(3);
//   const totalExpenses = Math.ceil(expenses.length / expensesPerPage);

//   const lastPage = currentPage * expensesPerPage;
//   const firstPage = lastPage - expensesPerPage;
//   const paginationExpenses = dailyExpenses.slice(firstPage, lastPage);

//   const prev = () => {
//     if (currentPage > 1) {
//       setCurrentPage(currentPage - 1);
//     }
//   };

//   const next = () => {
//     if (currentPage < totalExpenses) {
//       setCurrentPage(currentPage + 1);
//     }
//   };

//   useEffect(() => {
//     fetchExpenses();
//   }, []);

//   const fetchExpenses = async () => {
//     const response = await axios.get("https://expenses-tracker-server-e5h3.onrender.com/api/expenses");
//     setExpenses(response.data);
//     processExpenses(response.data);
//   };

//   const processExpenses = (data) => {
//     const today = new Date().toISOString().split("T")[0];
//     const dailyExp = data.filter((exp) => exp.created_at.startsWith(today));
//     setDailyExpenses(dailyExp);

//     const total = dailyExp.reduce((sum, exp) => sum + exp.amount, 0);
//     setTotalDailyExpense(total);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (editingId) {
//       await axios.put(`https://expenses-tracker-server-e5h3.onrender.com/api/expenses/${editingId}`, {
//         amount,
//         currency,
//         comment,
//       });
//     } else {
//       await axios.post("https://expenses-tracker-server-e5h3.onrender.com/api/expenses", {
//         amount,
//         currency,
//         comment,
//       });
//     }
//     setAmount("");
//     setCurrency("");
//     setComment("");
//     setEditingId(null);
//     fetchExpenses();
//   };

//   const handleEdit = (expense) => {
//     setAmount(expense.amount);
//     setCurrency(expense.currency);
//     setComment(expense.comment);
//     setEditingId(expense._id);
//   };

//   const handleDelete = async (id) => {
//     await axios.delete(`https://expenses-tracker-server-e5h3.onrender.com/api/expenses/${id}`);
//     fetchExpenses();
//   };

//   return (
//     <div className="container">
//       <h1>Expense Tracker</h1>
//       <div className="charts">
//         <div className="chart">
//           <h2>Daily Expenses</h2>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={dailyExpenses}>
//               <XAxis dataKey="comment" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Bar dataKey="amount" fill="#8884d8" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//         <div className="chart">
//           <h2>currency graph</h2>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={dailyExpenses}>
//               <XAxis dataKey="comment" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Bar dataKey="currency" fill="#82ca9d" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//         <div className="chart">
//           <h2>Total Daily Expense</h2>
//           <ResponsiveContainer width="100%" height={300}>
//             <LineChart data={[{ name: "Today", total: totalDailyExpense }]}>
//               <XAxis dataKey="name" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Line type="monotone" dataKey="total" stroke="#8884d8" />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </div>
//       <div className="expense-list">
//         <h2>Today's Expenses</h2>
//         <ul>
//           {paginationExpenses.map((expense) => (
//             <li key={expense._id}>
//               <div className="item">
//                 <p className="comment">{expense.comment}</p>
//                 <p className="amount">
//                   {expense.amount} {expense.currency}
//                 </p>
//               </div>
//               <div className="details">
//                 <p>{format(new Date(expense.created_at), "PPpp")}</p>
//                 <div className="buttons">
//                   <button onClick={() => handleEdit(expense)} className="edit">
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => handleDelete(expense._id)}
//                     className="delete"
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             </li>
//           ))}
//         </ul>
//         <div className="paginationBtn">
//           <button
//             onClick={prev}
//             disabled={currentPage === 1}
//             className="prevBtn"
//           >
//             prev
//           </button>
//           <button
//             onClick={next}
//             disabled={currentPage === totalExpenses}
//             className="nextBtn"
//           >
//             Next
//           </button>
//         </div>
//       </div>
//       <form onSubmit={handleSubmit} className="expense-form">
//         <div className="form-group">
//           <label htmlFor="amount">Amount</label>
//           <input
//             id="amount"
//             type="number"
//             value={amount}
//             onChange={(e) => setAmount(e.target.value)}
//             placeholder="Enter amount"
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="currency">Currency</label>
//           <input
//             id="currency"
//             type="text"
//             value={currency}
//             onChange={(e) => setCurrency(e.target.value)}
//             placeholder="Enter currency"
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="comment">Comment</label>
//           <input
//             id="comment"
//             type="text"
//             value={comment}
//             onChange={(e) => setComment(e.target.value)}
//             placeholder="Enter comment"
//           />
//         </div>
//         <button type="submit" className="submit-btn">
//           {editingId ? "Update" : "Add"} Expense
//         </button>
//       </form>
//     </div>
//   );
// }
