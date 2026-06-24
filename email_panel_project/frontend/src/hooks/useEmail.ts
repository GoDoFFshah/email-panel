import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'react-toastify'

export const useEmail = () => {
  const queryClient = useQueryClient()

  // Get campaigns
  const useCampaigns = (params?: any) => {
    return useQuery({
      queryKey: ['campaigns', params],
      queryFn: async () => {
        const response = await axios.get('/api/emails/campaigns/', { params })
        return response.data
      },
    })
  }

  // Get single campaign
  const useCampaign = (id: string) => {
    return useQuery({
      queryKey: ['campaign', id],
      queryFn: async () => {
        const response = await axios.get(`/api/emails/campaigns/${id}/`)
        return response.data
      },
      enabled: !!id,
    })
  }

  // Create campaign
  const useCreateCampaign = () => {
    return useMutation({
      mutationFn: async (data: any) => {
        const response = await axios.post('/api/emails/campaigns/', data)
        return response.data
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['campaigns'] })
        toast.success('Campaign created successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create campaign')
      },
    })
  }

  // Send campaign
  const useSendCampaign = () => {
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data?: any }) => {
        const response = await axios.post(`/api/emails/campaigns/${id}/send/`, data)
        return response.data
      },
      onSuccess: (data) => {
        toast.success(`Campaign sending started! (${data.total_recipients} recipients)`)
        queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to send campaign')
      },
    })
  }

  // Get senders
  const useSenders = () => {
    return useQuery({
      queryKey: ['senders'],
      queryFn: async () => {
        const response = await axios.get('/api/senders/')
        return response.data
      },
    })
  }

  // Get categories
  const useCategories = () => {
    return useQuery({
      queryKey: ['categories'],
      queryFn: async () => {
        const response = await axios.get('/api/categories/')
        return response.data
      },
    })
  }

  // Get tracking
  const useRecipientTracking = () => {
    return useQuery({
      queryKey: ['recipient-tracking'],
      queryFn: async () => {
        const response = await axios.get('/api/emails/tracking/')
        return response.data
      },
    })
  }

  return {
    useCampaigns,
    useCampaign,
    useCreateCampaign,
    useSendCampaign,
    useSenders,
    useCategories,
    useRecipientTracking,
  }
}