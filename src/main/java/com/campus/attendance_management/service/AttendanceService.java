package com.campus.attendance_management.service;

import com.campus.attendance_management.entity.Attendance;
import com.campus.attendance_management.repository.AttendanceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AttendanceService {
    private final AttendanceRepository attendanceRepository;

    public AttendanceService(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    public Attendance createAttendance(Attendance attendance) {
        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    public Attendance getAttendanceById(Long id) {
        return attendanceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attendance record not found"));
    }

    public Attendance updateAttendance(Long id, Attendance details) {
        Attendance existing = getAttendanceById(id);
        existing.setEmployeeName(details.getEmployeeName());
        existing.setDepartment(details.getDepartment());
        existing.setAttendanceDate(details.getAttendanceDate());
        existing.setStatus(details.getStatus());
        existing.setCheckInTime(details.getCheckInTime());
        existing.setCheckOutTime(details.getCheckOutTime());
        return attendanceRepository.save(existing);
    }

    public void deleteAttendance(Long id) {
        Attendance existing = getAttendanceById(id);
        attendanceRepository.delete(existing);
    }
}
