// Screen S-012: 달력 메인 화면 (홈)
// Related feature: F-003 수업 일정 관리
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, Badge, Button } from '../../components';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, layout, borderRadius } from '../../constants/spacing';

// Mock data
const mockLessons = [
  {
    id: '1',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '14:00',
    endTime: '16:00',
    subject: '수학',
    studentName: '김민수',
    attendanceStatus: 'pending',
  },
  {
    id: '2',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '17:00',
    endTime: '19:00',
    subject: '영어',
    studentName: '이지은',
    attendanceStatus: 'present',
  },
];

const CalendarMainScreen = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [refreshing, setRefreshing] = useState(false);

  // 선택된 날짜의 수업 필터링
  const todayLessons = useMemo(() => {
    return mockLessons.filter((lesson) => lesson.date === selectedDate);
  }, [selectedDate]);

  // 수업이 있는 날짜 마킹
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    mockLessons.forEach((lesson) => {
      marks[lesson.date] = {
        ...marks[lesson.date],
        marked: true,
        dotColor: colors.primary[500],
      };
    });

    // 선택된 날짜
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: colors.primary[500],
    };

    return marks;
  }, [selectedDate]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: API 호출
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getAttendanceBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge variant="success">출석</Badge>;
      case 'absent':
        return <Badge variant="error">결석</Badge>;
      case 'late':
        return <Badge variant="warning">지각</Badge>;
      default:
        return <Badge variant="secondary">예정</Badge>;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WeTee</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'calendar' && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode('calendar')}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === 'calendar' && styles.toggleTextActive,
            ]}
          >
            달력 뷰
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'list' && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode('list')}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === 'list' && styles.toggleTextActive,
            ]}
          >
            리스트 뷰
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {viewMode === 'calendar' && (
          <>
            {/* Calendar */}
            <Calendar
              current={selectedDate}
              onDayPress={handleDayPress}
              markedDates={markedDates}
              theme={{
                backgroundColor: colors.white,
                calendarBackground: colors.white,
                textSectionTitleColor: colors.text.secondary,
                selectedDayBackgroundColor: colors.primary[500],
                selectedDayTextColor: colors.white,
                todayTextColor: colors.primary[500],
                dayTextColor: colors.text.primary,
                textDisabledColor: colors.gray[300],
                dotColor: colors.primary[500],
                selectedDotColor: colors.white,
                arrowColor: colors.primary[500],
                monthTextColor: colors.text.primary,
                textDayFontWeight: '400',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12,
              }}
              style={styles.calendar}
            />

            {/* Selected Date Header */}
            <View style={styles.dateHeader}>
              <Text style={styles.dateHeaderText}>
                {format(parseISO(selectedDate), 'M월 d일 (EEEE)', { locale: ko })}
              </Text>
              <Text style={styles.lessonCount}>
                {todayLessons.length}개의 수업
              </Text>
            </View>
          </>
        )}

        {/* Lesson Cards */}
        <View style={styles.lessonList}>
          {todayLessons.length === 0 ? (
            <Card variant="outlined" style={styles.emptyCard}>
              <Text style={styles.emptyText}>예정된 수업이 없습니다</Text>
            </Card>
          ) : (
            todayLessons.map((lesson) => (
              <Card
                key={lesson.id}
                variant="elevated"
                onPress={() => console.log('Lesson detail:', lesson.id)}
                style={styles.lessonCard}
              >
                <View style={styles.lessonHeader}>
                  <View style={styles.lessonTime}>
                    <Text style={styles.timeText}>
                      {lesson.startTime} - {lesson.endTime}
                    </Text>
                  </View>
                  {getAttendanceBadge(lesson.attendanceStatus)}
                </View>

                <View style={styles.lessonInfo}>
                  <Badge variant="primary" size="small">
                    {lesson.subject}
                  </Badge>
                  <Text style={styles.studentName}>{lesson.studentName}</Text>
                </View>

                <View style={styles.lessonActions}>
                  <Button
                    variant="secondary"
                    size="small"
                    onPress={() => console.log('Check attendance')}
                  >
                    출결 체크
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    onPress={() => console.log('Record lesson')}
                  >
                    수업 기록
                  </Button>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.primary[500],
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 20,
    color: colors.white,
    fontWeight: '600',
  },
  viewToggle: {
    flexDirection: 'row',
    padding: spacing[2],
    backgroundColor: colors.white,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary[50],
  },
  toggleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  toggleTextActive: {
    color: colors.primary[500],
  },
  scrollView: {
    flex: 1,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing[4],
    backgroundColor: colors.white,
  },
  dateHeaderText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  lessonCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  lessonList: {
    padding: layout.screenPaddingHorizontal,
    gap: spacing[3],
  },
  lessonCard: {
    marginBottom: spacing[3],
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.text.hint,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  lessonTime: {},
  timeText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  lessonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  studentName: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  lessonActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
});

export default CalendarMainScreen;
