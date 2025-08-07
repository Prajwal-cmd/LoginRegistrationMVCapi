using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Web.Configuration;
using LoginRegistrationMVC.Models;
using Newtonsoft.Json;

namespace LoginRegistrationMVC.Services
{
    public class ApiService
    {
        private readonly HttpClient _httpClient;

        public ApiService()
        {
            _httpClient = new HttpClient();
            _httpClient.BaseAddress = new Uri(WebConfigurationManager.AppSettings["ApiBaseUrl"]);
        }

        public ApiResponse<List<Student>> GetAllStudents()
        {
            var response = _httpClient.GetAsync("api/students").Result;
            response.EnsureSuccessStatusCode();
            var responseString = response.Content.ReadAsStringAsync().Result;
            var students = JsonConvert.DeserializeObject<List<Student>>(responseString); // Matches API's raw List<Student>
            return new ApiResponse<List<Student>>
            {
                Data = students,
                Success = true,
                Message = "Students retrieved successfully"
            };
        }

        public ApiResponse<Student> GetStudent(int id)
        {
            var response = _httpClient.GetAsync($"api/students/{id}").Result;
            response.EnsureSuccessStatusCode();
            var responseString = response.Content.ReadAsStringAsync().Result;
            return JsonConvert.DeserializeObject<ApiResponse<Student>>(responseString) ?? new ApiResponse<Student> { Success = false, Error = "Invalid response" };
        }

        public ApiResponse<int> AddStudent(Student student)
        {
            var content = new StringContent(JsonConvert.SerializeObject(student), System.Text.Encoding.UTF8, "application/json");
            var response = _httpClient.PostAsync("api/students", content).Result;
            response.EnsureSuccessStatusCode();
            var responseString = response.Content.ReadAsStringAsync().Result;
            return JsonConvert.DeserializeObject<ApiResponse<int>>(responseString) ?? new ApiResponse<int> { Success = false, Error = "Invalid response" };
        }

        public ApiResponse<object> UpdateStudent(int id, Student student)
        {
            var content = new StringContent(JsonConvert.SerializeObject(student), System.Text.Encoding.UTF8, "application/json");
            var response = _httpClient.PutAsync($"api/students/{id}", content).Result;
            response.EnsureSuccessStatusCode();
            var responseString = response.Content.ReadAsStringAsync().Result;
            return JsonConvert.DeserializeObject<ApiResponse<object>>(responseString) ?? new ApiResponse<object> { Success = false, Error = "Invalid response" };
        }

        public ApiResponse<object> DeleteStudent(int id)
        {
            var response = _httpClient.DeleteAsync($"api/students/{id}").Result;
            response.EnsureSuccessStatusCode();
            var responseString = response.Content.ReadAsStringAsync().Result;
            return JsonConvert.DeserializeObject<ApiResponse<object>>(responseString) ?? new ApiResponse<object> { Success = false, Error = "Invalid response" };
        }
    }
}