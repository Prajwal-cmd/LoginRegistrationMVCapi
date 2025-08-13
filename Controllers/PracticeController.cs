using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;



namespace LoginRegistrationMVC.Controllers
{
    public class PracticeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        // Details view is static now; JS handles data (but keep if you want a separate page, or merge into Index)
        public ActionResult Details(int id)  // Optional: If separate page needed
        {
            ViewBag.DepartmentId = id;  // Pass ID to view for JS use
            return View();
        }
    }
}