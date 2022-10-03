import './App.css';
import { Button, Container, Row, Col, DropdownButton, Dropdown, ButtonGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css'
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.min.css';
import axios from 'axios';
import { AxiosProvider, Request, Get, Delete, Head, Post, Put, Patch, withAxios } from 'react-axios'
import Select from 'react-dropdown-select';
import moment from 'moment/moment';
import Spinner from 'react-bootstrap/Spinner';



function App() {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [userdata, setUserdata] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedUser, setSelectedUser] = useState({ id: 0, name: "" });
  const [selectedproject, setSelectedproject] = useState({ id: 0, name: "" });
  const [no_of_dates, setNo_of_dates] = useState([]);
  const [days, setDays] = useState([]);
  const [taskData, setTaskData] = useState([]);
  const [newData, setNewData] = useState([]);
  const [tasks, setTasks] = useState([]);
  let total_data = [];
  const [total, setTotal] = useState([4, 5, 8, 7])
  const [totalHours_perDate, setTotalHours_perDate] = useState([]);
  const [loader,setLoader] = useState(false);




  const handleOccupancy = (e) => {
    setSelectedUser({ id: e.target.value });
  };
  const handleProject = (e) => {
    setSelectedproject({ id: e.target.value });
  };

  //to get all users
  const getUsers = () => {
    axios.get("http://ec2-13-233-207-203.ap-south-1.compute.amazonaws.com:3000/clickup/team")
      .then((data) => {
        setUserdata(data.data.teams[0].members)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  //to get all projects
  const getProjects = () => {
    axios.get("http://ec2-13-233-207-203.ap-south-1.compute.amazonaws.com:3000/clickup/folder")
      .then((data) => {
        setProjects(data.data.folders)
      })
      .catch((err) => {
        console.log(err)
      })
  }
  var getDateArray = function (start, end) {
    let totalDays = [];
    var arr = new Array();
    var day = [];
    var dt = new Date(start);
    while (dt <= end - 1) {
      arr.push({ dates: moment(dt).format("DD-MM"), day: moment(dt).format("dddd").substring(0, 3) });
      dt.setDate(dt.getDate() + 1);
    }

    return arr;
  }
  getDateArray(startDate, endDate);

  useEffect(() => {
    getUsers();
    getProjects();

  }, []);

  // dummyMerge is to merge duplicate and non-duplicate  and remove duplicates
  const dummyMerge = (a, b) =>
    a.map((o, i) => {
      const [key] = Object.keys(o)
      return key ? { [key]: o[key] || b[i][key] } : o
    })

  useEffect(() => {
    let days = 7
    setEndDate(startDate.getTime() + (days * 24 * 60 * 60 * 1000))

  }, [startDate])

  useEffect(() => {
    setNo_of_dates(getDateArray(startDate, endDate))
  }, [startDate, endDate])

  // this function calls when user clicks on submit button 
  const SubmitDates = () => {
    let filterTasks = [];
    let st_date = startDate.getTime();
    let total_Hours = 0;
    setLoader(true);

      
    axios.get("http://ec2-13-233-207-203.ap-south-1.compute.amazonaws.com:3000/clickup/time_entries?start_date=" + st_date + "&end_date=" + endDate + "&assignee=" + selectedUser.id)
      .then((data) => {
        console.log(data.data.data);
        setLoader(false);
        const finalArray = [];
        const final_Array = [];
        
        const requiredData = data.data.data.map((iteam) => {
          console.log(iteam)
          return {
            task: iteam.task?.name,
            date: new Date(parseInt(iteam.start)).toLocaleDateString(),
            duration: (iteam.duration / (1000 * 60 * 60)).toFixed(1),
          };
        });
        
        const allTaskWithNoDuplicate = requiredData
          .map((iteam) => iteam.task)
          .filter((val, idx, arr) => arr.indexOf(val) === idx);


        const duplicateTask = requiredData
          .map((iteam) => iteam.task)
          .filter((val, idx, arr) => arr.indexOf(val) !== idx);


        // Removeing duplicates task from allTaskWithNoDuplicate
        const removeDuplicateTask = allTaskWithNoDuplicate.filter(
          (task) => !duplicateTask.includes(task)
        );


        // Push Non Duplicate Task To Blank Array
        const nonDuplicateData = requiredData.forEach(
          (obj) => removeDuplicateTask.includes(obj.task) && finalArray.push(obj)
        );


        //Array of Object with duplicate objects
        const filteredObj = requiredData.filter((obj) =>
          duplicateTask.includes(obj.task)
        );


        // Adding Object Duration of duplicate values
        const newArray = filteredObj.reduce((previousValue, currentValue) => {


          const found = previousValue.findIndex(
            (element) =>
              element.task === currentValue.task && element.date === currentValue.date
          );
          //  console.log("found", found);
          if (found !== -1) {
            const sumDuration =
              parseFloat(previousValue[found].duration) +
              parseFloat(currentValue.duration);
            previousValue.splice(found, 1);
            return [...previousValue, { ...currentValue, duration: sumDuration }];
          } else {
            return [...previousValue, currentValue];
          }
        }, []);


        total_data = [...finalArray, ...newArray];




        let dates_duration = [];
        let total_taskhours;
        total_data.map((data, idx) => {
          dates_duration = [];
          total_taskhours = 0;
          // console.log( moment(data.date).format('DD-MM'));
          no_of_dates.map((date, id) => {


            if (moment(data.date).format('DD-MM') == date.dates) {
              // console.log(date.dates,data.duration)
              dates_duration.push({ [date.dates]: data.duration })
              total_taskhours = Number(total_taskhours) + Number(data.duration);
            } else {
              dates_duration.push({ [date.dates]: null })
            }

          })
          // dates_duration.push({["total_duration"] : total_taskhours})
          data["dur"] = dates_duration;

        })




        const tasks_with_noduplicate = total_data
          .map((iteam) => iteam.task)
          .filter((val, idx, arr) => arr.indexOf(val) === idx);
        // console.log(tasks_with_noduplicate)

        const duplicate_Task = total_data
          .map((iteam) => iteam.task)
          .filter((val, idx, arr) => arr.indexOf(val) !== idx);

        // console.log(duplicate_Task);

        const remove_DuplicateTask = tasks_with_noduplicate.filter(
          (task) => !duplicate_Task.includes(task)
        );
        //  console.log(remove_DuplicateTask)

        const non_DuplicateData = total_data.forEach(
          (obj) => remove_DuplicateTask.includes(obj.task) && final_Array.push(obj)
        );
        // console.log(final_Array)

        const filtered_Obj = total_data.filter((obj) =>
          duplicate_Task.includes(obj.task)
        );
        console.log(filtered_Obj)
        const new_Array = filtered_Obj.reduce((previousValue, currentValue) => {


          const found_index = previousValue.findIndex(
            (element) =>
              element.task === currentValue.task && element.date !== currentValue.date
          );
          if (found_index !== -1) {
            const mergeDuration = dummyMerge(previousValue[found_index].dur, currentValue.dur);

            previousValue.splice(found_index, 1);
            return [...previousValue, { ...currentValue, dur: mergeDuration }];
          } else {
            return [...previousValue, currentValue];
          }

        }, []);

        total_data = [...final_Array, ...new_Array];
        console.log(no_of_dates)
        let totalhours = 0;
        let totalhours_datewise = [];
        let hours_per_day = 0;
        no_of_dates.map((date, i) => {
          totalhours_datewise.push({ [date.dates]: null })

        })
        total_data.map((data, idx) => {
          totalhours = 0;
          no_of_dates.map((date, id) => {
            if (moment(data.date).format('DD-MM') == date.dates) {
              data.dur.map((hours, i) => {
                totalhours = Number(totalhours) + Number(Object.values(hours));
              })
            }
          })
          data.dur.map((item, id) => {
            totalhours_datewise.map((dat, id) => {
              if (Object.keys(dat)[0] === Object.keys(item)[0]) {
                Object.keys(dat).forEach(key => {
                  dat[key] += Number(Object.values(item));
                  total_Hours += Number(Object.values(item))
                });
              }

            })
          })



          data.dur.push({ ["totalhours"]: totalhours });

        })
        totalhours_datewise.push({"total" : total_Hours})
        setTotalHours_perDate(totalhours_datewise);
        setTasks([...final_Array, ...new_Array]);

        setNewData(filterTasks);
        //  console.log(filterTasks);
      })
      .catch((err) => {
        //console.log(err)
      })
  }

  // this function is to print
  const print = () => {
    window.print();
  }
console.log(totalHours_perDate)
  return (
    <div className='container'>


      <Container fluid className='header mb-5'>
        <div className='date_container'>Start Date :

        </div>
        {/* <Col > */}
          <DatePicker
            dateFormat="dd/MM/yyyy"
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            filterDate={date => date.getDay(date) === 1}
            placeholderText="Select a Monday"
          />
        {/* </Col> */}
        <select
          onChange={handleOccupancy}
          name=""
          id=""
          className="fc-select-group filter_select_option"
        >
          <option >Select User</option>
          {userdata && userdata.map((variant) => {
            return <option value={variant.user.id}>{variant.user.username}</option>

          })}
          

        </select>
        <select
          onChange={handleProject}
          name=""
          id=""
          className="fc-select-group filter_select_option"
        >
          <option >Select Project</option>
          {projects && projects.map((variant) => {
            return <option value={variant.id}>{variant.name}</option>

          })}

        </select>
        <Button onClick={SubmitDates}>Submit</Button>
        <Button onClick={print} className="ms-5" >Print</Button>
      </Container>
    
{loader &&   <div className="spinner-border text-primary" style={{width: "5rem", height: "5rem", marginLeft:"50%", marginTop : "10%"}} role="status">

</div>}
     {!loader &&  <table className='table table-bordered table-striped'>
        <thead>

          <tr>
            <th>Task</th>

            {no_of_dates && no_of_dates.map((dates, id) => {

              return (
                <th>
                  {dates.dates} <br />
                  {dates.day}

                </th>)
            })

            }
            <th>Total hours</th>
          </tr>

        </thead>
        <tbody>
          {tasks && tasks.map((data, id) => {

            return (
              <tr>
                <td>{data.task} </td>
                {data.dur.map((items, id) => {
                  return (
                    <td>{Object.values(items)}</td>
                  )
                })}

              </tr>
            )
          })}
          <tr>
            <td style={{ float: "right" }}>Total</td>
            {totalHours_perDate.map((data, i) => {
              return (
                <td>{Number(Object.values(data)).toFixed(2)}</td>

              )
            })}
          </tr>
        </tbody>
      </table> }
      <h5 className = "signature">Authorized Signature :-</h5>
    </div>
  );
}

export default App;

