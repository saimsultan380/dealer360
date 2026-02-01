'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Mail, MessageSquare } from 'lucide-react';

export function NotificationSettings() {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [dealNotifications, setDealNotifications] = useState(true);
    const [paymentNotifications, setPaymentNotifications] = useState(true);
    const [leadNotifications, setLeadNotifications] = useState(true);
    const [dailyReports, setDailyReports] = useState(false);
    const [weeklyReports, setWeeklyReports] = useState(true);

    // In a real app, these would be saved to the database
    const handleToggle = (setting: string, value: boolean) => {
        // Here you would save to database
        console.log(`Setting ${setting} to ${value}`);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        General Notifications
                    </CardTitle>
                    <CardDescription>
                        Manage how you receive notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5 flex-1 min-w-0">
                            <Label htmlFor="email-notifications" className="text-sm sm:text-base">Email Notifications</Label>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Receive notifications via email
                            </p>
                        </div>
                        <Switch
                            id="email-notifications"
                            checked={emailNotifications}
                            onCheckedChange={(checked) => {
                                setEmailNotifications(checked);
                                handleToggle('emailNotifications', checked);
                            }}
                            className="shrink-0"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5 flex-1 min-w-0">
                            <Label htmlFor="deal-notifications" className="text-sm sm:text-base">Deal Notifications</Label>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Get notified about new deals and updates
                            </p>
                        </div>
                        <Switch
                            id="deal-notifications"
                            checked={dealNotifications}
                            onCheckedChange={(checked) => {
                                setDealNotifications(checked);
                                handleToggle('dealNotifications', checked);
                            }}
                            className="shrink-0"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5 flex-1 min-w-0">
                            <Label htmlFor="payment-notifications" className="text-sm sm:text-base">Payment Notifications</Label>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Receive alerts for payment due dates
                            </p>
                        </div>
                        <Switch
                            id="payment-notifications"
                            checked={paymentNotifications}
                            onCheckedChange={(checked) => {
                                setPaymentNotifications(checked);
                                handleToggle('paymentNotifications', checked);
                            }}
                            className="shrink-0"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5 flex-1 min-w-0">
                            <Label htmlFor="lead-notifications" className="text-sm sm:text-base">Lead Notifications</Label>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Get notified about new leads
                            </p>
                        </div>
                        <Switch
                            id="lead-notifications"
                            checked={leadNotifications}
                            onCheckedChange={(checked) => {
                                setLeadNotifications(checked);
                                handleToggle('leadNotifications', checked);
                            }}
                            className="shrink-0"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Reports
                    </CardTitle>
                    <CardDescription>
                        Configure automated email reports
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5 flex-1 min-w-0">
                            <Label htmlFor="daily-reports" className="text-sm sm:text-base">Daily Reports</Label>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Receive daily summary reports
                            </p>
                        </div>
                        <Switch
                            id="daily-reports"
                            checked={dailyReports}
                            onCheckedChange={(checked) => {
                                setDailyReports(checked);
                                handleToggle('dailyReports', checked);
                            }}
                            className="shrink-0"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5 flex-1 min-w-0">
                            <Label htmlFor="weekly-reports" className="text-sm sm:text-base">Weekly Reports</Label>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Receive weekly summary reports
                            </p>
                        </div>
                        <Switch
                            id="weekly-reports"
                            checked={weeklyReports}
                            onCheckedChange={(checked) => {
                                setWeeklyReports(checked);
                                handleToggle('weeklyReports', checked);
                            }}
                            className="shrink-0"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
