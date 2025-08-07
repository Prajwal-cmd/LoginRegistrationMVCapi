using System.Web.Mvc;

namespace LoginRegistrationMVC.Controllers
{
    [Authorize]
    public class StudentsController : Controller
    {
        [HttpGet]
        public ActionResult Index()
        {
            return View();
        }
    }
}